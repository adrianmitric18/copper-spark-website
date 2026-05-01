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

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public/sitemap.xml");

const HOST = "https://cuivre-electrique.com";

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

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((r) => {
    const lastmod = getLastModForFile(r.sourceFile);
    return `  <url>
    <loc>${HOST}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(2)}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>
`;

writeFileSync(OUT, xml, "utf8");
console.log(`sitemap.xml regenerated — ${routes.length} URLs, lastmod from git per file`);
