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
 * Choix réellement proposés à l'étape 1.
 *
 * `depannage` n'est PAS un besoin simulable : une panne ne se chiffre pas à
 * l'avance. Il sort du parcours et affiche directement la grille tarifaire de
 * dépannage. Il est donc exclu de `Besoin`, qui reste le domaine du calcul.
 */
export type ChoixEtape1 = Besoin | "depannage";

/** Valeurs acceptées dans `/simulateur?besoin=…` (pré-sélection depuis une page d'origine). */
export const CHOIX_ETAPE_1: ChoixEtape1[] = ["borne", "rgie", "combine", "depannage"];

/**
 * Clé d'icône. La correspondance clé -> composant Lucide se fait dans l'UI
 * (SimulateurUI.tsx) : ce fichier reste du pur contenu, sans dépendance React.
 */
export type IconeChoix =
  | "borne"
  | "conformite"
  | "combine"
  | "depannage"
  | "proche"
  | "allee"
  | "creuser"
  | "recente"
  | "classique"
  | "ancienne"
  | "inconnu"
  | "voiture"
  | "societe"
  | "immeuble"
  | "vente"
  | "certificat"
  | "travaux";

export interface ChoixSimple<T extends string> {
  value: T;
  label: string;
  description?: string;
  icone: IconeChoix;
}

export const BESOINS: ChoixSimple<ChoixEtape1>[] = [
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
  {
    value: "depannage",
    icone: "depannage",
    label: "Un dépannage ou une panne",
    description: "Plus de courant, un disjoncteur qui saute, une prise qui a chauffé.",
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
//  Contexte de la mise en conformité (parcours RGIE seul)
// =====================================================================

/**
 * Le parcours « RGIE seul » ne pose aucune question de borne : ni la distance
 * borne / tableau, ni l'usage du véhicule. À la place de la question d'usage,
 * on demande le motif de la mise en conformité — c'est ce qui intéresse
 * réellement Adrian pour rappeler (une vente a une échéance notariale, pas une
 * remise en ordre de confort).
 */
export type ContexteRgie = "vente" | "certificat" | "travaux" | "professionnel";

export const CONTEXTES_RGIE: ChoixSimple<ContexteRgie>[] = [
  {
    value: "vente",
    icone: "vente",
    label: "Je vends mon habitation",
    description: "Le certificat est réclamé par le notaire pour passer l'acte.",
  },
  {
    value: "certificat",
    icone: "certificat",
    label: "Mon certificat arrive à échéance",
    description: "Un certificat de conformité est valable 25 ans.",
  },
  {
    value: "travaux",
    icone: "travaux",
    label: "Après des travaux, ou une installation neuve",
    description: "Le contrôle est obligatoire avant la mise en service.",
  },
  {
    value: "professionnel",
    icone: "societe",
    label: "C'est pour un bien professionnel",
    description: "Société, indépendant, ou bien mis en location.",
  },
];

/**
 * Usage déduit du contexte RGIE.
 *
 * Le calcul et l'enregistrement du lead raisonnent sur `Usage` ; plutôt que
 * d'ouvrir un second axe dans le moteur de calcul, on projette le contexte sur
 * l'usage correspondant. Seul « bien professionnel » change quelque chose :
 * le lead est marqué Professionnel et les mentions de facturation société
 * s'affichent.
 */
export const USAGE_PAR_CONTEXTE_RGIE: Record<ContexteRgie, Usage> = {
  vente: "personnel",
  certificat: "personnel",
  travaux: "personnel",
  professionnel: "societe",
};

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
//  Tarifs — dépannage (aucun calcul, grille affichée telle quelle)
// =====================================================================

/**
 * Une panne ne se simule pas : on ne sait ni ce qui a lâché, ni combien de
 * temps il faudra. L'entrée « dépannage » de l'étape 1 court-circuite donc le
 * parcours et affiche cette grille, puis les deux seules actions utiles :
 * appeler, ou envoyer un message WhatsApp.
 */
export const DEPANNAGE = {
  accroche:
    "Une panne ne s'estime pas en ligne : elle se règle au téléphone, puis sur place. Voici nos tarifs, sans détour.",
  lignes: [
    {
      libelle: "Journée et soirée",
      detail: "Le tarif horaire courant, week-end compris.",
      montant: "50 €/h",
    },
    {
      libelle: "Urgence de nuit",
      detail: "Intervention en pleine nuit, 7 j/7.",
      montant: "100 €/h",
    },
    {
      libelle: "Déplacement",
      detail: "Forfait annoncé et accepté avant que nous prenions la route.",
      montant: "dès 25 €",
    },
  ],
  mentionTva:
    "Tarifs hors TVA. TVA en sus : 6 % pour un logement de plus de 10 ans, 21 % sinon.",
  mentionMateriel:
    "Le matériel éventuellement nécessaire (différentiel, disjoncteur, prise…) est facturé en sus, après votre accord.",
  messageWhatsApp:
    "Bonjour, j'ai un problème électrique et je souhaite un dépannage. Voici ma situation :",
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

/**
 * Nettoie une saisie de GSM avant validation : ne garde que les chiffres et un
 * éventuel « + » de tête.
 *
 * Espaces (y compris insécables), points, tirets de toutes largeurs, barres
 * obliques et parenthèses sont ignorés. Un numéro belge valide ne doit jamais
 * être refusé à cause de son formatage : « 0470 12 34 56 »,
 * « +32 470/12.34.56 » et « 0032-470-123-456 » désignent le même numéro.
 */
export const nettoyerGsm = (input: string): string => {
  const avecPlus = input.trimStart().startsWith("+");
  // \D retire tout ce qui n'est pas un chiffre, « + » compris : d'où le
  // drapeau relevé avant, puis réappliqué.
  const chiffres = input.replace(/\D/g, "");
  return avecPlus ? `+${chiffres}` : chiffres;
};

/**
 * Filtre la frappe dans le champ GSM, à la volée.
 *
 * Retire ce qui ne peut appartenir à un numéro (lettres collées par un
 * copier-coller depuis une signature de mail) mais laisse les séparateurs :
 * se battre avec quelqu'un qui tape ses espaces est le meilleur moyen de lui
 * faire abandonner le formulaire. Retire aussi le préfixe pays, déjà affiché à
 * gauche du champ, pour ne pas obtenir « +32 +32 470… ».
 */
export const saisirGsm = (brut: string): string =>
  brut
    .replace(/[^\d+\s.\-/()]/g, "")
    .replace(/^\s*(?:\+\s*32|0032)/, "")
    // Le préfixe retiré laisse son séparateur derrière lui : « +32 470… »
    // deviendrait «  470… » et « 0032-470… » deviendrait « -470… ». La saisie
    // se faisant caractère par caractère, ce nettoyage doit être réappliqué à
    // chaque frappe, pas seulement au collage.
    .replace(/^[\s.\-/()]+/, "");

/**
 * Email. Volontairement permissive (on ne rejette pas une adresse valide et
 * exotique), mais suffisante pour écarter les saisies qui ne partiront jamais.
 *
 * Répliquée côté base dans la policy RLS de la branche simulateur :
 *   '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
 * Toute modification ici doit être reportée dans une migration.
 */
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const UPLOAD = {
  /** Taille maximale acceptée avant compression, en Mo. */
  maxMo: 8,
  /**
   * Au-delà de ce poids, on compresse côté client avant l'envoi. Une photo de
   * tableau prise au téléphone pèse couramment 3 à 5 Mo : sur une 4G moyenne,
   * l'envoyer telle quelle fait patienter une minute devant un bouton figé.
   */
  seuilCompressionMo: 2,
  /** Poids visé après compression. */
  cibleCompressionMo: 1.5,
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
