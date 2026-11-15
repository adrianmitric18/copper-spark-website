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

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { SITEMAP_ROUTES } from "./routes.mjs";
import { loadRealisations } from "./realisations-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public/sitemap.xml");

const HOST = "https://cuivre-electrique.com";

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
 * Les réalisations publiées viennent du snapshot figé par
 * scripts/fetch-realisations.mjs (1er pas du build) : même source que le
 * pré-rendu, donc chaque URL listée ici a bien son HTML statique.
 * Snapshot vide (Supabase injoignable au build) = sitemap sans chantiers,
 * jamais un build rouge.
 */
const chantiers = loadRealisations().projects;
if (chantiers.length === 0) {
  console.warn("  ⚠ snapshot sans réalisation — sitemap généré SANS les chantiers");
}

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
