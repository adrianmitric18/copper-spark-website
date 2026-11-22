// Demande de devis de borne avec photos — page /devis-borne.
//
// Tout ce que le formulaire demande est décrit ici : questions, choix, photos.
// La page (src/pages/DevisBorne.tsx) ne fait que l'afficher, et l'envoi
// (submit.ts) en tire le résumé lisible enregistré dans la fiche.
//
// Règles d'Adrian (2026-11-22) :
//   - obligatoires : nom, téléphone OU e-mail, code postal. Tout le reste est
//     facultatif, en cases à cocher, avec des mots simples ;
//   - les photos sont conseillées, jamais obligatoires ;
//   - copropriété ou entreprise → on oriente vers la Zaptec Pro, sans prix ;
//   - un seul délai annoncé, celui de la page bornes ;
//   - le devis sur photos est donné sous réserve de vérification sur place.

/**
 * Origine écrite dans `leads.source`. Elle doit figurer dans la contrainte
 * `leads_source_allowed` ET avoir son cas dans la policy d'insertion (migration
 * 20261122120000_devis_borne_photos.sql). Ne pas la renommer sans migration :
 * c'est exactement ce qui a empêché le simulateur d'enregistrer d'août à
 * novembre 2026. Vérifier avec `node scripts/test-insertion-leads.mjs devis`.
 */
export const SOURCE_DEVIS_BORNE = "devis_borne";

/**
 * Règle de clarté (Adrian, 2026-11-22) : le client ne doit jamais avoir à
 * choisir entre plusieurs formulaires. Sur les pages qui parlent de bornes,
 * tout bouton « devis » mène à /devis-borne ; partout ailleurs, à /contact.
 * /devis-borne n'est ni dans le menu ni sur les pages qui ne parlent pas de bornes.
 */
export const PAGE_DEVIS_BORNE = "/devis-borne";
export const PAGES_BORNES: ReadonlySet<string> = new Set(["/services/bornes-de-recharge", PAGE_DEVIS_BORNE]);
export const lienDevisPour = (pathname: string): string =>
  PAGES_BORNES.has(pathname.replace(/\/+$/, "") || "/") ? PAGE_DEVIS_BORNE : "/contact";

/** Service imposé par la policy : la demande est ainsi toujours comptée. */
export const SERVICE_BORNE = "Borne de recharge voiture électrique";

/** Délai annoncé : le même que sur la page bornes, mot pour mot. */
export const DELAI = "Réponse sous 24 h, devis gratuit sous 48 h.";

export const RESERVE =
  "Le devis fait sur photos est donné sous réserve de vérification sur place.";

export const ORIENTATION_ZAPTEC_PRO =
  "Pour plusieurs bornes, nous posons en général la Zaptec Pro : les bornes se partagent toutes seules la puissance disponible, et chacune compte sa propre consommation. Le prix se fait sur devis.";

// ---------------------------------------------------------------------------
//  Photos
// ---------------------------------------------------------------------------

export type IdPhoto = "compteur" | "tableau_pres" | "tableau_loin" | "emplacement" | "trajet";

export interface PhotoDemandee {
  id: IdPhoto;
  titre: string;
  /** Une phrase simple : quoi photographier. */
  consigne: string;
}

export const PHOTOS: PhotoDemandee[] = [
  {
    id: "compteur",
    titre: "Le compteur",
    consigne:
      "De face, assez près pour que l'étiquette et les chiffres soient lisibles. C'est elle qui nous dit quelle puissance est possible.",
  },
  {
    id: "tableau_pres",
    titre: "Le tableau ouvert, de près",
    consigne: "Porte ouverte, de face, pour voir tous les disjoncteurs et la place libre.",
  },
  {
    id: "tableau_loin",
    titre: "Le tableau de loin",
    consigne: "Deux pas en arrière, pour voir le mur et la place autour du tableau.",
  },
  {
    id: "emplacement",
    titre: "L'endroit où la borne sera posée",
    consigne: "Le mur ou l'emplacement prévu, avec l'endroit où la voiture se gare.",
  },
  {
    id: "trajet",
    titre: "Le trajet du câble",
    consigne:
      "Une vue d'ensemble, du tableau jusqu'à la borne : couloir, garage, façade ou jardin à traverser.",
  },
];

export const PHOTO_LIMITES = {
  /** Types acceptés (les mêmes que côté serveur, migration du 22/11/2026). */
  types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  /** Au-delà, le fichier est refusé avant même d'être réduit. */
  maxMoAvantReduction: 25,
  /**
   * Chaque photo est réduite avant l'envoi : une photo de téléphone pèse 3 à
   * 6 Mo, cinq photos sur une mauvaise connexion ne partiraient jamais.
   * 1600 px suffisent pour lire une étiquette de compteur.
   */
  cibleMo: 0.6,
  coteMaxPx: 1600,
  bucket: "lead-photos",
} as const;

// ---------------------------------------------------------------------------
//  Questions à cocher
// ---------------------------------------------------------------------------

export interface Choix {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  /** Question posée au visiteur. */
  titre: string;
  /** Libellé court, pour le résumé enregistré dans la fiche. */
  court: string;
  choix: Choix[];
}

const oui_non_nsp: Choix[] = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "nsp", label: "Je ne sais pas" },
];

export const QUESTIONS = {
  logement: {
    id: "logement",
    titre: "C'est pour…",
    court: "Lieu",
    choix: [
      { value: "maison", label: "Une maison" },
      { value: "copropriete", label: "Un appartement en copropriété" },
      { value: "entreprise", label: "Une entreprise" },
    ],
  },
  statut: {
    id: "statut",
    titre: "Vous êtes…",
    court: "Statut",
    choix: [
      { value: "proprietaire", label: "Propriétaire" },
      { value: "locataire", label: "Locataire" },
    ],
  },
  accord: {
    id: "accord",
    titre: "L'accord du propriétaire ou du syndic, vous l'avez ?",
    court: "Accord propriétaire / syndic",
    choix: [
      { value: "oui", label: "Oui" },
      { value: "pas_encore", label: "Pas encore" },
      { value: "nsp", label: "Je ne sais pas" },
    ],
  },
  age: {
    id: "age",
    titre: "Le logement a plus de 10 ans ?",
    court: "Logement de plus de 10 ans",
    choix: oui_non_nsp,
  },
  emplacement: {
    id: "emplacement",
    titre: "Où sera la borne ?",
    court: "Emplacement",
    choix: [
      { value: "garage", label: "Dans le garage" },
      { value: "facade", label: "Sur la façade" },
      { value: "carport", label: "Sous un carport" },
      { value: "poteau", label: "Sur un poteau dans l'allée" },
    ],
  },
  distance: {
    id: "distance",
    titre: "Distance entre le tableau et la borne",
    court: "Distance tableau → borne",
    choix: [
      { value: "moins_10", label: "Moins de 10 m" },
      { value: "10_25", label: "10 à 25 m" },
      { value: "plus_25", label: "Plus de 25 m" },
      { value: "nsp", label: "Je ne sais pas" },
    ],
  },
  passage: {
    id: "passage",
    titre: "Par où passera le câble ?",
    court: "Passage du câble",
    choix: [
      { value: "interieur", label: "À l'intérieur" },
      { value: "mur", label: "Un mur à percer" },
      { value: "tranchee", label: "Une tranchée dans le jardin" },
      { value: "nsp", label: "Je ne sais pas" },
    ],
  },
  wifi: {
    id: "wifi",
    titre: "Le Wi-Fi arrive-t-il à l'endroit de la borne ?",
    court: "Wi-Fi à l'endroit de la borne",
    choix: oui_non_nsp,
  },
  usage: {
    id: "usage",
    titre: "La voiture est…",
    court: "Voiture",
    choix: [
      { value: "privee", label: "Une voiture privée" },
      { value: "societe", label: "Une voiture de société" },
    ],
  },
  borne: {
    id: "borne",
    titre: "Quelle borne souhaitez-vous ?",
    court: "Borne souhaitée",
    choix: [
      { value: "zaptec_go_2", label: "Zaptec Go 2" },
      { value: "alfen", label: "Alfen" },
      { value: "deja", label: "J'ai déjà ma borne" },
      { value: "conseil", label: "Conseillez-moi" },
    ],
  },
  nombre: {
    id: "nombre",
    titre: "Combien de bornes ?",
    court: "Nombre de bornes",
    choix: [
      { value: "1", label: "Une" },
      { value: "2", label: "Deux" },
      { value: "3_plus", label: "Trois ou plus" },
    ],
  },
  remplacement: {
    id: "remplacement",
    titre: "Y a-t-il déjà une borne à remplacer ?",
    court: "Borne existante à remplacer",
    choix: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
    ],
  },
  panneaux: {
    id: "panneaux",
    titre: "Avez-vous des panneaux solaires ?",
    court: "Panneaux solaires",
    choix: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
    ],
  },
  quand: {
    id: "quand",
    titre: "Pour quand ?",
    court: "Pour quand",
    choix: [
      { value: "vite", label: "Dès que possible" },
      { value: "1_3_mois", label: "Dans 1 à 3 mois" },
      { value: "plus_tard", label: "Plus tard, je me renseigne" },
    ],
  },
  suite: {
    id: "suite",
    titre: "Vous préférez…",
    court: "Suite souhaitée",
    choix: [
      { value: "devis", label: "Envoyez-moi directement un devis" },
      { value: "rappel", label: "Rappelez-moi d'abord" },
    ],
  },
} satisfies Record<string, Question>;

export type IdQuestion = keyof typeof QUESTIONS;

/** Ordre du résumé enregistré dans la fiche. */
export const ORDRE_RESUME: IdQuestion[] = [
  "logement",
  "statut",
  "accord",
  "age",
  "emplacement",
  "distance",
  "passage",
  "wifi",
  "usage",
  "borne",
  "nombre",
  "remplacement",
  "panneaux",
  "quand",
  "suite",
];

export type Reponses = Partial<Record<IdQuestion, string>>;

/** Champs libres (tous facultatifs). */
export interface Textes {
  modem: string;
  voiture: string;
  modeleBorne: string;
  message: string;
}

export interface Coordonnees {
  nom: string;
  telephone: string;
  email: string;
  codePostal: string;
}

export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const REGEX_CODE_POSTAL = /^[0-9]{4}$/;

/** Copropriété ou entreprise : on oriente vers la Zaptec Pro. */
export const orienterVersZaptecPro = (r: Reponses): boolean =>
  r.logement === "copropriete" || r.logement === "entreprise";

/** La question de l'accord ne se pose qu'à un locataire ou en copropriété. */
export const demanderAccord = (r: Reponses): boolean =>
  r.statut === "locataire" || r.logement === "copropriete";

const libelle = (id: IdQuestion, value: string | undefined): string | null =>
  value ? (QUESTIONS[id].choix.find((c) => c.value === value)?.label ?? value) : null;

/** Téléphone tel qu'enregistré : chiffres et « + » seulement, vide si absent. */
export const nettoyerTelephone = (saisie: string): string => saisie.replace(/[^\d+]/g, "");

export interface Erreurs {
  nom?: string;
  contact?: string;
  email?: string;
  telephone?: string;
  codePostal?: string;
}

/** Les trois seules choses obligatoires : nom, téléphone ou e-mail, code postal. */
export function valider(c: Coordonnees): Erreurs {
  const e: Erreurs = {};
  const tel = nettoyerTelephone(c.telephone);
  const email = c.email.trim();
  if (c.nom.trim().length < 2) e.nom = "Indiquez votre nom.";
  if (!tel && !email) e.contact = "Indiquez un téléphone ou un e-mail, au choix.";
  if (tel && (tel.length < 6 || tel.length > 30)) e.telephone = "Ce numéro semble incomplet.";
  if (email && !REGEX_EMAIL.test(email)) e.email = "Cette adresse e-mail semble incomplète.";
  if (!REGEX_CODE_POSTAL.test(c.codePostal.trim())) e.codePostal = "Code postal à 4 chiffres.";
  return e;
}

/**
 * Résumé lisible, enregistré dans `leads.message` : c'est ce qu'Adrian lit
 * dans l'admin et dans l'e-mail, sans avoir à décoder le payload.
 */
export function resumer(r: Reponses, t: Textes, c: Coordonnees, nbPhotos: number, photos: IdPhoto[]): string {
  const lignes: string[] = ["DEMANDE DE DEVIS BORNE (formulaire avec photos)", ""];
  lignes.push(`Code postal : ${c.codePostal.trim()}`);
  for (const id of ORDRE_RESUME) {
    if (id === "accord" && !demanderAccord(r)) continue;
    const l = libelle(id, r[id]);
    if (!l) continue;
    let ligne = `${QUESTIONS[id].court} : ${l}`;
    if (id === "borne" && r.borne === "deja" && t.modeleBorne.trim()) ligne += ` (${t.modeleBorne.trim()})`;
    lignes.push(ligne);
    if (id === "wifi" && t.modem.trim()) lignes.push(`Emplacement du modem : ${t.modem.trim()}`);
    if (id === "usage" && t.voiture.trim()) lignes.push(`Marque et modèle : ${t.voiture.trim()}`);
  }
  if (!r.wifi && t.modem.trim()) lignes.push(`Emplacement du modem : ${t.modem.trim()}`);
  if (!r.usage && t.voiture.trim()) lignes.push(`Voiture : ${t.voiture.trim()}`);
  if (orienterVersZaptecPro(r)) lignes.push("→ Copropriété ou entreprise : orienté vers la Zaptec Pro, sans prix annoncé.");
  lignes.push("");
  lignes.push(
    nbPhotos === 0
      ? "Photos : aucune."
      : `Photos : ${nbPhotos}, visibles dans l'admin (${photos
          .map((id) => PHOTOS.find((p) => p.id === id)?.titre.toLowerCase() ?? id)
          .join(" ; ")}).`,
  );
  if (t.message.trim()) {
    lignes.push("");
    lignes.push("Message du client :");
    lignes.push(t.message.trim());
  }
  return lignes.join("\n");
}
