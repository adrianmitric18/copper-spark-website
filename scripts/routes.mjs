// Source unique des routes publiques statiques du site.
//
// Consommée par :
//   - scripts/generate-sitemap.mjs  → public/sitemap.xml (SITEMAP_ROUTES seules)
//   - scripts/prerender.mjs         → dist/<route>/index.html (SITEMAP_ROUTES + NOINDEX_ROUTES)
//
// Ajouter une page = ajouter une ligne ici, et nulle part ailleurs.
//
// NE JAMAIS lister ici :
//   - une route qui redirige (les <Navigate> de App.tsx) — Google veut des 200 OK
//   - /realisations/:slug — contenu Supabase, varie sans redéploiement
//   - /admin/* — noindex, derrière authentification
//   - /merci — page de confirmation post-formulaire, sans intérêt d'indexation

/** @typedef {{ path: string; changefreq: string; priority: number; sourceFile: string }} Route */

/**
 * Routes indexables : présentes dans le sitemap ET pré-rendues.
 * @type {Route[]}
 */
export const SITEMAP_ROUTES = [
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
 * Pages légales : pré-rendues (le HTML statique reste utile aux visiteurs et
 * au temps de premier affichage) mais volontairement HORS sitemap — elles sont
 * en noindex, les lister enverrait un signal contradictoire à Google.
 * @type {{ path: string; sourceFile: string }[]}
 */
export const NOINDEX_ROUTES = [
  { path: "/mentions-legales", sourceFile: "src/pages/MentionsLegales.tsx" },
  { path: "/cgv", sourceFile: "src/pages/CGV.tsx" },
  { path: "/confidentialite", sourceFile: "src/pages/Confidentialite.tsx" },
];

/**
 * Liste plate des chemins à pré-rendre au build.
 * @type {string[]}
 */
export const PRERENDER_PATHS = [
  ...SITEMAP_ROUTES.map((r) => r.path),
  ...NOINDEX_ROUTES.map((r) => r.path),
];
