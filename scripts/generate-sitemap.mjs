#!/usr/bin/env node
// Génère public/sitemap.xml à partir d'une liste de routes maintenue ici.
// Lance avec : npm run sitemap
//
// Pourquoi un script et pas un sitemap statique :
// - lastmod calculé à partir de la date de dernière modification GIT du
//   fichier source de chaque route (pas la date du build, pour ne pas
//   envoyer un faux signal de fraîcheur à chaque déploiement).
// - une seule source de vérité (les routes vivent ici, pas en doublon dans XML)
// - on peut ajouter/retirer une page sans toucher au XML
//
// IMPORTANT : ne JAMAIS lister une URL qui redirige (Google demande des
// 200 OK dans le sitemap). Les routes <Navigate> de App.tsx sont donc
// volontairement exclues. Les pages noindex (mentions, cgv, confidentialité)
// sont également exclues : Google les ignorerait, autant les retirer du
// sitemap pour ne pas envoyer de signal contradictoire.

import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

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

/** @typedef {{ path: string; changefreq: string; priority: number; sourceFile: string }} Route */

/** @type {Route[]} */
const routes = [
  { path: "/", changefreq: "weekly", priority: 1.0, sourceFile: "src/pages/Index.tsx" },

  // Services
  { path: "/services", changefreq: "monthly", priority: 0.95, sourceFile: "src/pages/Services.tsx" },
  { path: "/services/installation-electrique-renovation", changefreq: "monthly", priority: 0.9, sourceFile: "src/pages/services/InstallationRenovation.tsx" },
  { path: "/services/depannage-urgent", changefreq: "monthly", priority: 0.9, sourceFile: "src/pages/services/DepannageUrgent.tsx" },
  { path: "/services/mise-en-conformite-rgie", changefreq: "monthly", priority: 0.9, sourceFile: "src/pages/services/MiseEnConformiteRgie.tsx" },
  { path: "/services/bornes-de-recharge", changefreq: "monthly", priority: 0.9, sourceFile: "src/pages/services/BornesDeRecharge.tsx" },
  { path: "/services/panneaux-photovoltaiques", changefreq: "monthly", priority: 0.9, sourceFile: "src/pages/services/PanneauxPhotovoltaiques.tsx" },

  // Zones SEO locales
  { path: "/electricien-court-saint-etienne", changefreq: "monthly", priority: 0.8, sourceFile: "src/pages/zones/ElectricienCourtSaintEtienne.tsx" },
  { path: "/electricien-wavre", changefreq: "monthly", priority: 0.8, sourceFile: "src/pages/zones/ElectricienWavre.tsx" },
  { path: "/electricien-ottignies-louvain-la-neuve", changefreq: "monthly", priority: 0.8, sourceFile: "src/pages/zones/ElectricienOttigniesLLN.tsx" },
  { path: "/electricien-nivelles", changefreq: "monthly", priority: 0.8, sourceFile: "src/pages/zones/ElectricienNivelles.tsx" },
  { path: "/electricien-genappe", changefreq: "monthly", priority: 0.8, sourceFile: "src/pages/zones/ElectricienGenappe.tsx" },

  // Pages secondaires
  { path: "/contact", changefreq: "monthly", priority: 0.95, sourceFile: "src/pages/Contact.tsx" },
  { path: "/avis", changefreq: "weekly", priority: 0.85, sourceFile: "src/pages/Avis.tsx" },
  { path: "/realisations", changefreq: "weekly", priority: 0.85, sourceFile: "src/pages/Realisations.tsx" },
  { path: "/a-propos", changefreq: "monthly", priority: 0.8, sourceFile: "src/pages/APropos.tsx" },
  { path: "/faq", changefreq: "monthly", priority: 0.75, sourceFile: "src/pages/FAQ.tsx" },
];

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

const staticUrls = routes.map((r) => ({
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
