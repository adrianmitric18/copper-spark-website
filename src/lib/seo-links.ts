export interface SeoLink {
  slug: string;
  label: string;
  href: string;
  description: string;
}

export const SERVICES_LINKS: SeoLink[] = [
  {
    slug: "installation-electrique-renovation",
    label: "Installation & rénovation",
    href: "/services/installation-electrique-renovation",
    description: "Tableau Schneider, prises Niko, câblage neuf ou rénovation.",
  },
  {
    slug: "depannage-urgent",
    label: "Dépannage urgent 24h/24",
    href: "/services/depannage-urgent",
    description: "Panne, court-circuit, disjoncteur — intervention rapide 7j/7.",
  },
  {
    slug: "mise-en-conformite-rgie",
    label: "Mise en conformité RGIE",
    href: "/services/mise-en-conformite-rgie",
    description: "Diagnostic, mise aux normes et accompagnement contrôle.",
  },
  {
    slug: "bornes-de-recharge",
    label: "Bornes de recharge",
    href: "/services/bornes-de-recharge",
    description: "Installation borne véhicule électrique avec étude préalable.",
  },
  {
    slug: "panneaux-photovoltaiques",
    label: "Panneaux photovoltaïques",
    href: "/services/panneaux-photovoltaiques",
    description: "Étude, pose et raccordement de votre installation solaire.",
  },
];

export const ZONES_LINKS: SeoLink[] = [
  {
    slug: "electricien-court-saint-etienne",
    label: "Court-Saint-Étienne",
    href: "/electricien-court-saint-etienne",
    description: "Notre commune d'attache — intervention prioritaire.",
  },
  {
    slug: "electricien-wavre",
    label: "Wavre",
    href: "/electricien-wavre",
    description: "Centre, Basse-Wavre, Bierges, Limal — env. 20 min.",
  },
  {
    slug: "electricien-ottignies-louvain-la-neuve",
    label: "Ottignies / Louvain-la-Neuve",
    href: "/electricien-ottignies-louvain-la-neuve",
    description: "LLN, Céroux-Mousty, Limelette — env. 10 min.",
  },
  {
    slug: "electricien-nivelles",
    label: "Nivelles",
    href: "/electricien-nivelles",
    description: "Centre et zone Sud du Brabant wallon.",
  },
  {
    slug: "electricien-genappe",
    label: "Genappe",
    href: "/electricien-genappe",
    description: "Genappe, Bousval, Loupoigne, Vieux-Genappe.",
  },
];
