// Maillage interne autour des réalisations (lot SEO/GEO 1, 2026-11).
//
//   réalisation → page service (via ses tags) et page zone (via sa commune)
//   page service / page zone → réalisations liées (depuis le snapshot du build)
//
// Tout vient du snapshot figé au build (`virtual:realisations`) : les liens sont
// donc présents dans le HTML pré-rendu, lisibles sans JavaScript. Une nouvelle
// réalisation apparaît ici après le rebuild déclenché par sa publication.

import { SERVICES_LINKS, ZONES_LINKS, type SeoLink } from "@/lib/seo-links";
import { SNAPSHOT } from "./snapshot";
import type { SnapshotProject } from "./types";

/**
 * Tag chantier (CHANTIER_TAGS) → slug de la page service.
 * « Décoration de Noël » et « Panneaux photovoltaïques » n'ont volontairement
 * pas de page service : pas de lien plutôt qu'un lien hors sujet.
 */
const SERVICE_PAR_TAG: Record<string, string> = {
  "Bornes de recharge VE": "bornes-de-recharge",
  "Mise en conformité RGIE": "mise-en-conformite-rgie",
  "Dépannage urgence": "depannage-urgent",
  "Rénovation tableau électrique": "installation-electrique-renovation",
  "Installation neuve": "installation-electrique-renovation",
  "Éclairage LED": "installation-electrique-renovation",
  Domotique: "installation-electrique-renovation",
  "Réseau / VDI": "installation-electrique-renovation",
  "Salle de bain": "installation-electrique-renovation",
};

/**
 * Mots (sans accents, en minuscules) qui rattachent une commune à une page
 * zone. Une réalisation « Brabant wallon » ou « Dinant » ne matche rien :
 * elle n'a simplement pas de page zone, et c'est voulu.
 */
const ZONE_PAR_MOT: Array<{ slug: string; mots: string[] }> = [
  { slug: "electricien-court-saint-etienne", mots: ["court-saint-etienne", "court saint etienne"] },
  { slug: "electricien-wavre", mots: ["wavre", "bierges", "limal"] },
  {
    slug: "electricien-ottignies-louvain-la-neuve",
    mots: ["ottignies", "louvain-la-neuve", "limelette", "ceroux-mousty"],
  },
  { slug: "electricien-nivelles", mots: ["nivelles"] },
  { slug: "electricien-genappe", mots: ["genappe", "baisy-thy", "bousval", "loupoigne", "houtain-le-val"] },
];

const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Vrai si `mot` apparaît dans `texte` comme mot entier (pas « ways » dans « always »). */
const contientMot = (texte: string, mot: string) => {
  const t = normaliser(texte);
  const m = normaliser(mot).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${m}($|[^a-z0-9])`).test(t);
};

const serviceParSlug = (slug: string) => SERVICES_LINKS.find((s) => s.slug === slug) ?? null;
const zoneParSlug = (slug: string) => ZONES_LINKS.find((z) => z.slug === slug) ?? null;

/** Page service d'une réalisation : premier tag qui a une page. */
export function serviceDeRealisation(tags: string[]): SeoLink | null {
  for (const tag of tags) {
    const slug = SERVICE_PAR_TAG[tag];
    if (slug) return serviceParSlug(slug);
  }
  return null;
}

/** Page zone d'une réalisation, d'après sa commune (`location`). */
export function zoneDeRealisation(location: string): SeoLink | null {
  for (const zone of ZONE_PAR_MOT) {
    if (zone.mots.some((mot) => contientMot(location, mot))) return zoneParSlug(zone.slug);
  }
  return null;
}

/** Réalisations du snapshot rattachées à une page service. */
export function realisationsPourService(serviceSlug: string): SnapshotProject[] {
  return SNAPSHOT.projects.filter((p) => serviceDeRealisation(p.tags)?.slug === serviceSlug);
}

/** Réalisations du snapshot situées dans la commune d'une page zone. */
export function realisationsPourZone(zoneSlug: string): SnapshotProject[] {
  return SNAPSHOT.projects.filter((p) => zoneDeRealisation(p.location)?.slug === zoneSlug);
}
