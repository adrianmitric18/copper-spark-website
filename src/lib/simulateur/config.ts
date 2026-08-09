/**
 * Simulateur de prix — TOUTES les valeurs modifiables sont ici.
 *
 * Adrian doit pouvoir ajuster un tarif sans toucher au reste du code : aucun
 * montant, aucun libellé de choix ne doit vivre ailleurs que dans ce fichier.
 *
 * Deux règles absolues, héritées du brief :
 *   1. Aucune mention du photovoltaïque nulle part dans le simulateur.
 *   2. Le passage de l'organisme agréé n'est JAMAIS présenté comme inclus dans
 *      la fourchette « borne de recharge ».
 */

// =====================================================================
//  Besoins (étape 1)
// =====================================================================

export type Besoin = "borne" | "rgie" | "combine";

/**
 * Clé d'icône. La correspondance clé -> composant Lucide se fait dans l'UI
 * (SimulateurUI.tsx) : ce fichier reste du pur contenu, sans dépendance React.
 */
export type IconeChoix =
  | "borne"
  | "conformite"
  | "combine"
  | "proche"
  | "allee"
  | "creuser"
  | "recente"
  | "classique"
  | "ancienne"
  | "inconnu"
  | "voiture"
  | "societe"
  | "immeuble";

export interface ChoixSimple<T extends string> {
  value: T;
  label: string;
  description?: string;
  icone: IconeChoix;
}

export const BESOINS: ChoixSimple<Besoin>[] = [
  {
    value: "borne",
    icone: "borne",
    label: "Installer une borne de recharge",
    description: "Pour recharger votre voiture électrique chez vous.",
  },
  {
    value: "rgie",
    icone: "conformite",
    label: "Mettre mon électricité en ordre",
    description:
      "Le contrôle officiel (RGIE) est obligatoire pour vendre, et après de gros travaux.",
  },
  {
    value: "combine",
    icone: "combine",
    label: "Les deux",
    description: "Une borne et la mise en ordre de l'électricité, en même temps.",
  },
];

// =====================================================================
//  Distance borne ↔ tableau (étape 2, uniquement si borne)
// =====================================================================

export type Distance = "proche" | "moyenne" | "longue" | "inconnue";

export const DISTANCES: ChoixSimple<Distance>[] = [
  {
    value: "proche",
    icone: "proche",
    label: "Tout près (même pièce ou mur voisin)",
  },
  {
    value: "moyenne",
    icone: "allee",
    label: "À quelques mètres (allée, carport)",
  },
  {
    value: "longue",
    icone: "creuser",
    label: "Loin, ou il faudra creuser",
  },
  {
    value: "inconnue",
    icone: "inconnu",
    label: "Je ne sais pas",
    description: "Pas de souci, on regarde ça ensemble.",
  },
];

/**
 * Surcoût ajouté à la base, en euros.
 *
 * Un intervalle et non un montant unique : quand le visiteur ne sait pas,
 * on ne devine pas à sa place, la fourchette couvre honnêtement les deux
 * situations possibles (tout près, ou quelques mètres).
 */
export const SURCOUT_DISTANCE: Record<Distance, { min: number; max: number }> = {
  proche: { min: 0, max: 0 },
  moyenne: { min: 250, max: 250 },
  inconnue: { min: 0, max: 250 },
  longue: { min: 0, max: 0 }, // non utilisé : bascule en cas complexe
};

/** Distances qui déclenchent un cas complexe (aucune fourchette affichée). */
export const DISTANCES_COMPLEXES: Distance[] = ["longue"];

// =====================================================================
//  État de l'installation (étape 3)
// =====================================================================

export type Installation = "recente" | "standard" | "ancienne" | "inconnue";

// Aucun terme technique ici : ni « monophasé », ni « triphasé », ni
// « différentiel ». Le visiteur décrit ce qu'il voit, pas ce qu'il ignore.
export const INSTALLATIONS: ChoixSimple<Installation>[] = [
  {
    value: "recente",
    icone: "recente",
    label: "Récente ou refaite il y a moins de 10 ans",
  },
  {
    value: "standard",
    icone: "classique",
    label: "Classique",
    description: "Elle fonctionne bien, sans être toute neuve.",
  },
  {
    value: "ancienne",
    icone: "ancienne",
    label: "Ancienne (vieux fusibles, maison pas rénovée)",
  },
  {
    value: "inconnue",
    icone: "inconnu",
    label: "Je ne sais pas",
    description: "Pas de souci, on vérifiera ensemble.",
  },
];

/** États qui élargissent la fourchette haute (incertitude technique). */
export const INSTALLATIONS_INCERTAINES: Installation[] = ["ancienne", "inconnue"];

// =====================================================================
//  Usage (étape 4)
// =====================================================================

export type Usage = "societe" | "personnel" | "copropriete";

export const USAGES: ChoixSimple<Usage>[] = [
  {
    value: "personnel",
    icone: "voiture",
    label: "Ma voiture personnelle",
  },
  {
    value: "societe",
    icone: "societe",
    label: "Une voiture de société, ou je suis indépendant",
    description: "Des avantages fiscaux existent dans ce cas.",
  },
  {
    value: "copropriete",
    icone: "immeuble",
    label: "Une copropriété ou plusieurs bornes",
    description: "Immeuble, parking partagé, ou plus d'une borne à poser.",
  },
];

/** Usages qui déclenchent un cas complexe (aucune fourchette affichée). */
export const USAGES_COMPLEXES: Usage[] = ["copropriete"];

// =====================================================================
//  Tarifs — borne de recharge
// =====================================================================

export const BORNE = {
  /**
   * Base d'une borne posée, TTC.
   * 2026-08-09 : relevé de 1 400 à 1 800 € après vérification des coûts réels
   * — la borne seule coûte déjà ~1 200 € HTVA à l'achat, un total posé à
   * 1 400 € TTC n'était pas tenable.
   */
  base: 1800,
  /**
   * Majoration appliquée au haut de fourchette quand l'installation est
   * incertaine (état ancien ou inconnu).
   */
  majorationIncertitude: 0.15,
  /**
   * Majoration appliquée au haut de fourchette dans TOUS les autres cas.
   * À 0.1, une vraie fourchette est affichée même sans incertitude technique
   * (à 0, l'écran afficherait « à partir de X € », le simulateur ne donnant
   * jamais de prix ferme).
   */
  majorationStandard: 0.1,
  /** Plafond absolu du haut de fourchette, TTC. */
  plafond: 3000,
} as const;

// =====================================================================
//  Tarifs — mise en conformité RGIE
// =====================================================================

/**
 * Fourchettes RGIE selon l'état déclaré de l'installation.
 *
 * Le brief fixe l'enveloppe globale (500 à 3 000 €) ; la graduation ci-dessous
 * répartit cette enveloppe selon la réponse de l'étape 3, pour ne pas afficher
 * un écart de 1 à 6 qui n'aiderait personne. Chiffres à ajuster librement.
 */
export const RGIE_FOURCHETTES: Record<Installation, { min: number; max: number }> = {
  recente: { min: 500, max: 1200 },
  standard: { min: 500, max: 2000 },
  ancienne: { min: 800, max: 3000 },
  // « Je ne sais pas » : on part du bas de la fourchette standard et on laisse
  // le haut ouvert. Ne jamais bloquer le visiteur, ne jamais lui promettre un
  // prix bas qu'on ne pourrait pas tenir.
  inconnue: { min: 500, max: 3000 },
};

/** Forfait fixe annoncé à part, jamais fondu dans la fourchette. */
export const RGIE_FORFAIT = {
  montant: 550,
  libelle:
    "S'ajoute un forfait fixe de 550 € : les plans de votre installation, et le passage de l'organisme officiel qui délivre le certificat.",
} as const;

// =====================================================================
//  Mentions affichées
// =====================================================================

export const MENTIONS = {
  estimationIndicative:
    "Estimation indicative — le devis définitif est confirmé par un électricien basé à Court-Saint-Étienne après visite ou photos.",
  tvaReduite:
    "TVA réduite à 6% sur la main-d'œuvre et le matériel pour votre logement de plus de 10 ans.",
  deductionSociete:
    "Sociétés & indépendants : déduction fiscale possible pour une borne intelligente.",
  facturationSociete:
    "Facturation adaptée pour les sociétés et indépendants : TVA déductible, attestation pour votre comptable.",
  splitBilling:
    "Les bornes connectées, Alfen en tête, gèrent le split-billing : l'électricité que vous consommez pour recharger est comptabilisée à part et peut vous être remboursée par votre employeur.",
  organismeNonInclus:
    "Le passage de l'organisme de contrôle officiel n'est pas compris dans cette fourchette.",
  estimationGlobale: "Estimation globale indicative pour les deux chantiers réunis.",
  casComplexe:
    "Votre projet mérite une visite gratuite sur place, pour mesurer et vous donner un prix juste.",
  electricienLocal:
    "Votre demande est traitée par un électricien local basé à Court-Saint-Étienne, pas par une plateforme.",
  rgpdCapture:
    "En validant, vous acceptez d'être recontacté par Le Cuivre Électrique au sujet de votre demande. Vos données ne sont jamais revendues.",
} as const;

// =====================================================================
//  Contact
// =====================================================================

export const CONTACT = {
  telephone: "+32485755227",
  telephoneAffiche: "0485 75 52 27",
  whatsapp: "32485755227",
} as const;

// =====================================================================
//  Anti-spam & upload
// =====================================================================

/** GSM belge. Utilisé côté client ET répliqué en contrainte RLS Supabase. */
export const REGEX_GSM_BELGE = /^(?:\+32|0032|0)?4[5-9]\d{7}$/;

export const UPLOAD = {
  /** Taille maximale acceptée avant compression, en Mo. */
  maxMo: 8,
  /** Au-delà de ce poids, on compresse côté client avant l'envoi. */
  seuilCompressionMo: 1.5,
  maxWidthOrHeight: 1920,
  bucket: "lead-photos",
} as const;

/**
 * En dessous de ce délai entre l'ouverture du simulateur et l'envoi, la
 * soumission est marquée comme suspecte dans le payload (sans être bloquée :
 * un faux positif ne doit jamais coûter un vrai lead).
 */
export const DELAI_SUSPECT_MS = 10_000;

/** Clé de session : une seule soumission par onglet. */
export const CLE_SESSION_ENVOI = "simulateur_envoye_v1";
