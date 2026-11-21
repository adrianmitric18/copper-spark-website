// Réalisations publiées, figées au build dans `.generated/realisations.json`.
//
// Source unique pour tout ce qui doit connaître les chantiers AVANT que React
// ne tourne :
//   - scripts/fetch-realisations.mjs  → écrit le fichier (1er pas du build)
//   - scripts/generate-sitemap.mjs    → une <url> par réalisation, avec lastmod
//   - scripts/prerender.mjs           → une page HTML statique par réalisation
//   - vite.config.ts (module virtuel `virtual:realisations`) → données
//     initiales des pages /realisations et /realisations/:slug, pour que le
//     HTML pré-rendu contienne le vrai contenu et que le visiteur ne voie pas
//     de spinner. React rafraîchit ensuite depuis Supabase au montage.
//
// Le fichier est ignoré par git (.gitignore → .generated/) : il est reconstruit
// à chaque build. Sans variables Supabase (CI sans env, poste hors ligne), on
// repart d'un snapshot vide : le site continue de fonctionner en mode SPA pour
// ces pages, exactement comme avant.
//
// Pourquoi pas lire Supabase pendant le pré-rendu ? Le pré-rendu coupe
// volontairement le réseau Supabase (déterminisme, voir prerender.mjs). Passer
// par un fichier figé garde ce déterminisme : le HTML ne dépend plus d'une
// course réseau, et le même build produit toujours le même résultat.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..");
export const SNAPSHOT_PATH = resolve(ROOT, ".generated/realisations.json");

export const EMPTY_SNAPSHOT = Object.freeze({
  generatedAt: null,
  supabaseUrl: null,
  projects: [],
});

/**
 * Charge les VITE_* du `.env` local dans process.env (sans écraser ce qui est
 * déjà défini : en CI Cloudflare, les variables viennent du dashboard).
 */
export function loadEnv() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(VITE_[A-Z_0-9]+)\s*=\s*"?([^"#\r\n]*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

/**
 * Lit le snapshot s'il existe, sinon renvoie un snapshot vide.
 * @returns {{ generatedAt: string | null, supabaseUrl: string | null, projects: any[] }}
 */
export function loadRealisations() {
  if (!existsSync(SNAPSHOT_PATH)) return { ...EMPTY_SNAPSHOT, projects: [] };
  try {
    const parsed = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
    if (!parsed || !Array.isArray(parsed.projects)) throw new Error("format inattendu");
    return parsed;
  } catch (err) {
    console.warn(`  ⚠ ${SNAPSHOT_PATH} illisible (${err.message}) — snapshot vide`);
    return { ...EMPTY_SNAPSHOT, projects: [] };
  }
}

/** Chemins publics des réalisations du snapshot (`/realisations/<slug>`). */
export function realisationPaths(snapshot = loadRealisations()) {
  return snapshot.projects
    .filter((p) => typeof p.slug === "string" && p.slug.length > 0)
    .map((p) => `/realisations/${p.slug}`);
}

export function writeSnapshot(snapshot) {
  mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
}

/**
 * Récupère les réalisations publiées (projets + images + tags) via l'API
 * publique Supabase, donc sous RLS : seuls les projets `published` non
 * supprimés sont visibles, comme pour un visiteur.
 *
 * Lève en cas d'erreur : c'est l'appelant qui décide du repli.
 */
export async function fetchRealisations() {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY absents");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    // Même tri que fetchPublishedProjects() côté site.
    .order("display_order", { ascending: true })
    .order("completed_at", { ascending: false });
  if (error) throw error;

  // Note et nombre d'avis de la fiche Google (table `google_rating`, saisie
  // dans /admin/avis). Figés ici pour que le HTML pré-rendu porte le vrai
  // nombre d'avis. Table vide ou erreur = null : le site retombe sur sa valeur
  // de secours, le build reste vert.
  let googleRating = null;
  const ratingRes = await supabase
    .from("google_rating")
    .select("rating, user_ratings_total")
    .eq("id", 1)
    .maybeSingle();
  if (!ratingRes.error && ratingRes.data) {
    const rating = Number(ratingRes.data.rating);
    const total = Number(ratingRes.data.user_ratings_total);
    if (Number.isFinite(rating) && Number.isFinite(total) && total > 0) {
      googleRating = { rating, total };
    }
  }

  const list = projects ?? [];
  if (list.length === 0) {
    return { generatedAt: new Date().toISOString(), supabaseUrl: url, googleRating, projects: [] };
  }

  const ids = list.map((p) => p.id);
  const [tagsRes, imagesRes] = await Promise.all([
    supabase.from("project_tags").select("project_id, tag").in("project_id", ids),
    supabase
      .from("project_images")
      .select("*")
      .in("project_id", ids)
      .order("sort_order", { ascending: true }),
  ]);
  if (tagsRes.error) throw tagsRes.error;
  if (imagesRes.error) throw imagesRes.error;

  const tagsByProject = new Map();
  for (const row of tagsRes.data ?? []) {
    const arr = tagsByProject.get(row.project_id) ?? [];
    arr.push(row.tag);
    tagsByProject.set(row.project_id, arr);
  }
  const imagesByProject = new Map();
  for (const img of imagesRes.data ?? []) {
    const arr = imagesByProject.get(img.project_id) ?? [];
    arr.push(img);
    imagesByProject.set(img.project_id, arr);
  }

  return {
    generatedAt: new Date().toISOString(),
    supabaseUrl: url,
    googleRating,
    projects: list.map((p) => ({
      ...p,
      tags: tagsByProject.get(p.id) ?? [],
      images: imagesByProject.get(p.id) ?? [],
    })),
  };
}
