#!/usr/bin/env node
// Génère public/sitemap.xml à partir de la liste de routes de scripts/routes.mjs.
// Lance avec : npm run sitemap
//
// Pourquoi un script et pas un sitemap statique :
// - lastmod calculé à partir de la date de dernière modification GIT du
//   fichier source de chaque route (pas la date du build, pour ne pas
//   envoyer un faux signal de fraîcheur à chaque déploiement).
// - une seule source de vérité (les routes vivent dans scripts/routes.mjs,
//   partagée avec le pré-rendu, pas en doublon dans XML)
// - on peut ajouter/retirer une page sans toucher au XML
//
// IMPORTANT : ne JAMAIS lister une URL qui redirige (Google demande des
// 200 OK dans le sitemap). Les routes <Navigate> de App.tsx sont donc
// volontairement exclues. Les pages noindex (mentions, cgv, confidentialité)
// vivent dans NOINDEX_ROUTES : elles sont pré-rendues mais pas listées ici,
// pour ne pas envoyer de signal contradictoire à Google.

import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { SITEMAP_ROUTES } from "./routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public/sitemap.xml");

const HOST = "https://cuivre-electrique.com";

// Charge .env manuellement — Vite expose VITE_* mais ce script tourne
// hors du contexte Vite donc process.env n'a pas accès aux vars sans aide.
const envPath = resolve(ROOT, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(VITE_[A-Z_0-9]+)\s*=\s*"?([^"#\r\n]*?)"?\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

/**
 * Récupère la date de dernier commit qui a touché le fichier source d'une
 * route. Tombe sur la date du build si git n'est pas disponible (build
 * sandbox sans .git/) ou si le fichier n'a pas encore d'historique.
 */
const getLastModForFile = (relPath) => {
  try {
    const isoDate = execSync(`git log -1 --format=%cI -- "${relPath}"`, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (isoDate) return isoDate.slice(0, 10);
  } catch {
    /* fallback */
  }
  return new Date().toISOString().slice(0, 10);
};

/**
 * Fetch les chantiers publiés (CMS Supabase) pour les inclure dans le
 * sitemap. Le sitemap doit refléter les URLs vivantes du site.
 *
 * Fallback silencieux : si Supabase est indisponible (réseau coupé, env
 * vars manquantes en CI, projet en pause), on continue avec un sitemap
 * partiel plutôt que de casser le build.
 */
async function fetchPublishedChantiers() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn(
      "  ⚠ VITE_SUPABASE_URL/KEY absents — sitemap généré SANS les chantiers Supabase",
    );
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("projects")
      .select("slug, updated_at")
      .eq("status", "published")
      .is("deleted_at", null);
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn(
      `  ⚠ Fetch chantiers Supabase a échoué (${err.message}) — sitemap généré SANS les chantiers`,
    );
    return [];
  }
}

const chantiers = await fetchPublishedChantiers();

const chantierUrls = chantiers
  .filter((c) => c.slug)
  .map((c) => ({
    loc: `${HOST}/realisations/${c.slug}`,
    lastmod: (c.updated_at ?? new Date().toISOString()).slice(0, 10),
    changefreq: "monthly",
    priority: 0.7,
  }));

const staticUrls = SITEMAP_ROUTES.map((r) => ({
  loc: `${HOST}${r.path}`,
  lastmod: getLastModForFile(r.sourceFile),
  changefreq: r.changefreq,
  priority: r.priority,
}));

const allUrls = [...staticUrls, ...chantierUrls];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(2)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(OUT, xml, "utf8");
console.log(
  `sitemap.xml regenerated — ${staticUrls.length} static + ${chantierUrls.length} chantiers = ${allUrls.length} URLs`,
);
