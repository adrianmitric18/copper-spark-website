#!/usr/bin/env node
// Génère public/sitemap.xml à partir d'une liste de routes maintenue ici.
// Lance avec : npm run sitemap
//
// Pourquoi un script et pas un sitemap statique :
// - lastmod toujours à jour (pas oublié pendant 6 mois)
// - une seule source de vérité (les routes vivent ici, pas en doublon dans XML)
// - on peut ajouter/retirer une page sans toucher au XML
//
// IMPORTANT : ne JAMAIS lister une URL qui redirige (Google demande des
// 200 OK dans le sitemap). Les routes <Navigate> de App.tsx sont donc
// volontairement exclues.

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public/sitemap.xml");

const HOST = "https://cuivre-electrique.com";

/** @typedef {{ path: string; changefreq: string; priority: number }} Route */

/** @type {Route[]} */
const routes = [
  { path: "/", changefreq: "weekly", priority: 1.0 },

  // Services
  { path: "/services", changefreq: "monthly", priority: 0.95 },
  { path: "/services/installation-electrique-renovation", changefreq: "monthly", priority: 0.9 },
  { path: "/services/depannage-urgent", changefreq: "monthly", priority: 0.9 },
  { path: "/services/mise-en-conformite-rgie", changefreq: "monthly", priority: 0.9 },
  { path: "/services/bornes-de-recharge", changefreq: "monthly", priority: 0.9 },
  { path: "/services/panneaux-photovoltaiques", changefreq: "monthly", priority: 0.9 },

  // Zones SEO locales
  { path: "/electricien-court-saint-etienne", changefreq: "monthly", priority: 0.8 },
  { path: "/electricien-wavre", changefreq: "monthly", priority: 0.8 },
  { path: "/electricien-ottignies-louvain-la-neuve", changefreq: "monthly", priority: 0.8 },
  { path: "/electricien-nivelles", changefreq: "monthly", priority: 0.8 },
  { path: "/electricien-genappe", changefreq: "monthly", priority: 0.8 },

  // Pages secondaires
  { path: "/contact", changefreq: "monthly", priority: 0.95 },
  { path: "/avis", changefreq: "weekly", priority: 0.85 },
  { path: "/realisations", changefreq: "weekly", priority: 0.85 },
  { path: "/a-propos", changefreq: "monthly", priority: 0.8 },
  { path: "/faq", changefreq: "monthly", priority: 0.75 },

  // Mentions légales (faible priorité, mais doit rester indexable)
  { path: "/mentions-legales", changefreq: "yearly", priority: 0.3 },
];

const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${HOST}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(2)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(OUT, xml, "utf8");
console.log(`sitemap.xml regenerated — ${routes.length} URLs, lastmod=${today}`);
