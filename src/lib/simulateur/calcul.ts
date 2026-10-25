/**
 * Simulateur de prix v2 — construction du mini-devis indicatif par poste.
 *
 * Fonction pure, sans effet de bord et sans dépendance React : tout le calcul
 * se fait côté client à partir des constantes de `config.ts`. Aucun appel
 * réseau, aucun tarif codé en dur ici.
 *
 * Deux principes qui tiennent tout le fichier :
 *   1. Chaque ligne du devis porte un montant qu'Adrian peut défendre au
 *      téléphone, ou dit honnêtement qu'elle n'est pas chiffrable en ligne.
 *      Pas de coefficient invisible appliqué au total.
 *   2. Un poste « à confirmer » n'entre JAMAIS dans le total. On n'affiche pas
 *      un total gonflé par un chiffre qu'on n'a pas.
 */

import {
  BORNE,
  DEPANNAGE,
  DISTANCES_COMPLEXES,
  FACTEUR_TVA_21,
  MENTIONS,
  RGIE_FORFAIT,
  RGIE_TRAVAUX,
  TABLEAUX_A_CONFIRMER,
  TABLEAUX_COMPLEXES,
  USAGES_COMPLEXES,
  ZONES,
  type AgeLogement,
  type ContexteRgie,
  type Distance,
  type EtatTableau,
  type Fourchette,
  type Fournisseur,
  type Moment,
  type NombreTableaux,
  type Parcours,
  type PreferenceRappel,
  type Usage,
} from "./config";

// =====================================================================
//  Réponses
// =====================================================================

export interface Reponses {
  parcours: Parcours;

  // --- Parcours borne ---
  fournisseur?: Fournisseur;
  /** Saisie libre, facultative, quand le visiteur fournit sa propre borne. */
  modeleBorne?: string;
  distance?: Distance;
  usage?: Usage;

  // --- Borne et RGIE ---
  /** État du tableau (borne) ou de l'installation (RGIE) : même échelle. */
  tableau?: EtatTableau;
  age?: AgeLogement;

  // --- Parcours RGIE ---
  contexteRgie?: ContexteRgie;
  nombreTableaux?: NombreTableaux;

  // --- Écran de capture (borne et RGIE uniquement) ---
  preferenceRappel?: PreferenceRappel;
}

// =====================================================================
//  Devis
// =====================================================================

/**
 * Statut d'une ligne.
 *
 * `compris` et `aConfirmer` existent pour la même raison : dire au visiteur ce
 * qui est prévu sans lui vendre un chiffre. La différence est qu'un poste
 * `compris` est déjà payé par la ligne du dessus, alors qu'un `aConfirmer`
 * viendra peut-être s'ajouter.
 */
export type StatutLigne = "chiffre" | "compris" | "aConfirmer" | "surDevis";

export interface LigneDevis {
  libelle: string;
  detail?: string;
  statut: StatutLigne;
  /** Renseigné uniquement quand `statut === "chiffre"`. */
  montant?: Fourchette;
  /**
   * Nom court repris dans l'intitulé du total quand la ligne est « à
   * confirmer » : « Total des postes chiffrés, hors adaptation du tableau ».
   */
  nomCourt?: string;
  /**
   * Ligne chiffrée qui n'entre PAS dans le total : un tarif unitaire affiché
   * pour information (la demi-heure supplémentaire du dépannage), pas un poste
   * dû d'office. Le détail de la ligne dit en toutes lettres qu'elle est en sus.
   */
  horsTotal?: boolean;
}

export interface Devis {
  parcours: Parcours;
  /** true = aucun prix affichable, on bascule sur la visite gratuite. */
  complexe: boolean;
  /** Raisons lisibles de la bascule, sans aucun métrage. */
  raisonsComplexe: string[];
  lignes: LigneDevis[];
  /** Somme des seules lignes chiffrées. */
  total?: Fourchette;
  /** Intitulé affiché au-dessus du total. Porte lui-même ce que le total exclut. */
  intituleTotal: string;
  /** Complément affiché sous le total (le taux de TVA, en général). */
  sousTitreTotal?: string;
  /** true si au moins une ligne reste à confirmer. */
  aConfirmer: boolean;
  /** Mentions toujours visibles sous le devis. */
  mentions: string[];
  /** Mentions secondaires, repliées derrière « Voir les détails ». */
  mentionsRepliees: string[];
}

// =====================================================================
//  Outils
// =====================================================================

/** Arrondi à la dizaine supérieure, pour ne jamais afficher 1 437,50 €. */
const arrondir = (n: number) => Math.ceil(n / 10) * 10;

/**
 * Passe une fourchette exprimée TTC 6 % au taux réellement applicable.
 *
 * Tous les tarifs de `config.ts` sont saisis à 6 % — le cas de très loin le
 * plus fréquent. Le 21 % est dérivé, jamais saisi : une seule liste de chiffres
 * à valider, et les deux colonnes ne peuvent pas diverger.
 *
 * « Je ne sais pas » affiche le cas le plus courant (6 %) et le dit en toutes
 * lettres dans les mentions, plutôt que de choisir le plus cher en silence.
 */
const appliquerTva = (f: Fourchette, age: AgeLogement | undefined): Fourchette => {
  const facteur = age === "moins10" ? FACTEUR_TVA_21 : 1;
  return { min: arrondir(f.min * facteur), max: arrondir(f.max * facteur) };
};

const somme = (lignes: LigneDevis[]): Fourchette | undefined => {
  const chiffrees = lignes.filter((l) => l.statut === "chiffre" && l.montant && !l.horsTotal);
  if (chiffrees.length === 0) return undefined;
  return chiffrees.reduce<Fourchette>(
    (acc, l) => ({ min: acc.min + l.montant!.min, max: acc.max + l.montant!.max }),
    { min: 0, max: 0 },
  );
};

const fixe = (montant: number): Fourchette => ({ min: montant, max: montant });

/** Devis « cas complexe » : aucun chiffre, aucune ligne, visite gratuite. */
const casComplexe = (parcours: Parcours, raisons: string[]): Devis => ({
  parcours,
  complexe: true,
  raisonsComplexe: raisons,
  lignes: [],
  intituleTotal: "",
  aConfirmer: false,
  mentions: [MENTIONS.casComplexe],
  mentionsRepliees: [],
});

/**
 * Bien professionnel ou voiture de société : aucun taux n'est affiché ferme.
 * Le taux dépend de l'affectation du bâtiment, pas de la qualité du client.
 */
const estProfessionnel = (r: Reponses): boolean =>
  r.usage === "societe" || r.contexteRgie === "professionnel";

/**
 * Taux affiché à côté du total.
 *
 * Sur un bien professionnel on ne peut pas affirmer le taux, mais le montant a
 * bien été calculé à un taux précis : on dit lequel, plutôt que d'annoncer une
 * « TVA comprise » dont personne ne connaît la valeur. Le client peut ainsi
 * anticiper l'écart si le taux définitif diffère.
 */
const taux = (r: Reponses): string => {
  const pourcent = r.age === "moins10" ? "21" : "6";
  return estProfessionnel(r)
    ? `calculé avec la TVA à ${pourcent} %`
    : `TVA ${pourcent} % comprise`;
};

/**
 * Intitulé du total.
 *
 * Quand des postes restent à confirmer, la réserve est portée par l'intitulé
 * LUI-MÊME, au-dessus du montant — pas par une note sous le montant. Le chiffre
 * en gros caractères est celui que le visiteur retient : il ne doit jamais
 * pouvoir être lu comme un total complet alors qu'il ne l'est pas.
 */
const intituleTotal = (r: Reponses, lignes: LigneDevis[]): string => {
  const aConfirmer = lignes
    .filter((l) => l.statut === "aConfirmer" && l.nomCourt)
    .map((l) => l.nomCourt as string);

  if (aConfirmer.length === 0) return `Total indicatif, ${taux(r)}`;

  const liste =
    aConfirmer.length === 1
      ? aConfirmer[0]
      : `${aConfirmer.slice(0, -1).join(", ")} et ${aConfirmer[aConfirmer.length - 1]}`;
  return `Total des postes chiffrés, hors ${liste}`;
};

/** Mention de TVA correspondante. */
const mentionTva = (r: Reponses): string => {
  if (estProfessionnel(r)) return MENTIONS.tvaProfessionnel;
  if (r.age === "moins10") return MENTIONS.tvaNormale;
  if (r.age === "plus10") return MENTIONS.tvaReduite;
  return MENTIONS.tvaInconnue;
};

// =====================================================================
//  Parcours borne
// =====================================================================

function devisBorne(r: Reponses): Devis {
  const raisons: string[] = [];
  if (r.distance && DISTANCES_COMPLEXES.includes(r.distance)) {
    // Aucun métrage ici : le visiteur a répondu « loin, ou il faudra creuser »,
    // on lui répond dans ses mots.
    raisons.push("Une tranchée ou un passage à creuser");
  }
  if (r.usage && USAGES_COMPLEXES.includes(r.usage)) {
    raisons.push("Une copropriété, ou plusieurs bornes à poser");
  }
  if (raisons.length > 0) return casComplexe("borne", raisons);

  const lignes: LigneDevis[] = [];

  // 1. La borne elle-même, fournie ou non.
  if (r.fournisseur === "client") {
    lignes.push({
      libelle: "Pose de votre borne",
      detail: r.modeleBorne?.trim()
        ? `Modèle que vous nous avez indiqué : ${r.modeleBorne.trim()}`
        : "Pose, raccordement et mise en service.",
      statut: "chiffre",
      montant: appliquerTva(BORNE.poseSeule, r.age),
    });
  } else {
    lignes.push({
      libelle: "Borne Alfen fournie et posée",
      detail: "Matériel, pose, raccordement et mise en service.",
      statut: "chiffre",
      montant: appliquerTva(BORNE.alfen, r.age),
    });
  }

  // 2. Liaison tableau -> borne.
  if (r.distance === "proche") {
    lignes.push({
      libelle: "Liaison entre le tableau et la borne",
      detail: "Comprise dans le prix ci-dessus : la borne est à côté du tableau.",
      statut: "compris",
    });
  } else if (r.distance) {
    lignes.push({
      libelle: "Liaison entre le tableau et la borne",
      detail:
        r.distance === "inconnue"
          ? "Selon la distance réelle, vérifiée sur place ou sur photo."
          : "Câble, protection et fixation jusqu'à l'emplacement de la borne.",
      statut: "chiffre",
      montant: appliquerTva(BORNE.liaison[r.distance], r.age),
    });
  }

  // 3. Adaptation du tableau. Jamais chiffrée en ligne sur un tableau qui n'est
  //    pas récent : c'est ce qu'Adrian a arbitré, et c'est ce qui se voit sur
  //    photo en dix secondes.
  if (r.tableau && TABLEAUX_A_CONFIRMER.includes(r.tableau)) {
    lignes.push({
      libelle: "Adaptation de votre tableau électrique",
      detail: "Se chiffre sur photo de votre tableau, ou lors de la visite.",
      statut: "aConfirmer",
      nomCourt: "adaptation du tableau",
    });
  } else if (r.tableau) {
    lignes.push({
      libelle: "Adaptation de votre tableau électrique",
      detail: "Rien à prévoir : votre tableau est récent.",
      statut: "compris",
    });
  }

  // 4. Protection 6 mA DC — uniquement quand la borne vient du client : sur une
  //    Alfen, elle est intégrée.
  if (r.fournisseur === "client") {
    lignes.push({
      libelle: "Protection différentielle 6 mA DC, si votre borne n'en a pas",
      detail: "Vérifié sur la fiche technique de votre borne avant confirmation du prix.",
      statut: "aConfirmer",
      // Le terme normatif reste sur la ligne du devis, où il est expliqué.
      // Dans l'intitulé du total — la ligne que tout le monde lit — il devient
      // du jargon inutile.
      nomCourt: "protection de la borne",
    });
  }

  // 5. L'argument commercial : ce que les autres devis sortent de leur total.
  lignes.push({
    libelle: "Dossier technique et contrôle par l'organisme agréé",
    detail: "Compris dans le prix ci-dessus.",
    statut: "compris",
  });

  const aConfirmer = lignes.some((l) => l.statut === "aConfirmer");

  const mentions: string[] = [MENTIONS.dossierCompris, mentionTva(r)];
  if (aConfirmer) mentions.push(MENTIONS.aConfirmer);
  mentions.push(MENTIONS.estimationIndicative);

  const mentionsRepliees: string[] = [MENTIONS.gestionDynamique];
  if (r.usage === "societe") {
    mentionsRepliees.push(
      MENTIONS.deductionSociete,
      MENTIONS.splitBilling,
      MENTIONS.facturationSociete,
    );
  }

  return {
    parcours: "borne",
    complexe: false,
    raisonsComplexe: [],
    lignes,
    total: somme(lignes),
    intituleTotal: intituleTotal(r, lignes),
    // Le taux ne disparaît pas : il passe sous le montant quand l'intitulé est
    // occupé par la réserve.
    sousTitreTotal: aConfirmer ? taux(r) : undefined,
    aConfirmer,
    mentions,
    mentionsRepliees,
  };
}

// =====================================================================
//  Parcours RGIE
// =====================================================================

function devisRgie(r: Reponses): Devis {
  // Plusieurs tableaux : le forfait ne s'applique plus, donc on n'affiche
  // aucun prix — ni le forfait, ni les travaux.
  if (r.nombreTableaux && TABLEAUX_COMPLEXES.includes(r.nombreTableaux)) {
    return casComplexe("rgie", ["Plusieurs tableaux électriques dans le bâtiment"]);
  }

  const lignes: LigneDevis[] = [];

  // Le forfait est affiché 550 € quel que soit le taux de TVA : le libellé
  // validé par Adrian porte le montant, il ne peut pas bouger à l'écran.
  lignes.push({
    libelle: "Forfait dossier et contrôle",
    detail: "Relevé sur place, plans, coordination et présence au contrôle.",
    statut: "chiffre",
    montant: fixe(RGIE_FORFAIT.montant),
  });

  if (r.tableau) {
    lignes.push({
      libelle: "Travaux de mise en conformité",
      detail: "Selon ce que le contrôle relève sur votre installation.",
      statut: "chiffre",
      montant: appliquerTva(RGIE_TRAVAUX[r.tableau], r.age),
    });
  }

  const mentions: string[] = [
    RGIE_FORFAIT.libelle,
    `${RGIE_FORFAIT.precision} ${RGIE_FORFAIT.secondPassage}`,
    RGIE_FORFAIT.glose,
    mentionTva(r),
  ];
  if (r.nombreTableaux === "inconnu") {
    mentions.push(
      "Le forfait vaut pour un seul tableau électrique. S'il y en a plusieurs, nous vous le disons avant toute intervention.",
    );
  }
  mentions.push(MENTIONS.estimationIndicative);

  const mentionsRepliees =
    r.contexteRgie === "professionnel" ? [MENTIONS.facturationSociete] : [];

  return {
    parcours: "rgie",
    complexe: false,
    raisonsComplexe: [],
    lignes,
    total: somme(lignes),
    intituleTotal: intituleTotal(r, lignes),
    aConfirmer: false,
    mentions,
    mentionsRepliees,
  };
}

// =====================================================================
//  Dépannage — plancher affiché (la grille elle-même vit dans ZONES)
// =====================================================================

/** Forfaits réellement facturés pour un moment (hors « confirmé par téléphone »). */
const forfaitsConnus = (moment: Moment): number[] => ZONES.map((z) => z.forfait[moment]);

/**
 * Prix plancher absolu d'une intervention : le forfait de la zone la moins
 * chère, pour le moment choisi (110 € en journée avec la grille du
 * 2026-10-25). Affiché sur la page dépannage, l'accueil et la FAQ — dérivé
 * des tarifs, jamais écrit en dur.
 */
export const plancherDepannage = (moment: Moment = "jour"): number =>
  Math.min(...forfaitsConnus(moment));

// =====================================================================
//  Point d'entrée
// =====================================================================

export function calculerDevis(reponses: Reponses): Devis {
  switch (reponses.parcours) {
    case "borne":
      return devisBorne(reponses);
    case "rgie":
      return devisRgie(reponses);
    case "depannage":
      // Plus de devis dépannage : la grille est affichée sur la page dépannage
      // et l'étape 1 y renvoie (2026-10-26). Garde-fou si un appel subsistait.
      throw new Error("Le dépannage n'a pas de devis en ligne : voir PAGE_DEPANNAGE.");
  }
}

// =====================================================================
//  Formatage
// =====================================================================

const euros = (n: number) =>
  new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Rend une fourchette en texte.
 *
 * Un montant unique s'affiche seul (« 550 € ») : c'est un forfait ou un tarif
 * de grille, pas un prix ferme déguisé. La réserve d'usage est portée par
 * l'intitulé du total (« Total indicatif », « À partir de ») et par les
 * mentions, jamais par la ligne elle-même.
 */
export function formatFourchette(f: Fourchette): string {
  return f.min === f.max ? euros(f.min) : `${euros(f.min)} – ${euros(f.max)}`;
}

/** Texte affiché à droite d'une ligne non chiffrée. */
export function libelleStatut(statut: StatutLigne): string {
  switch (statut) {
    case "compris":
      return "compris";
    case "aConfirmer":
      return "à confirmer";
    case "surDevis":
      return "sur devis";
    default:
      return "";
  }
}

/** Rend une ligne (montant ou statut) en une seule chaîne. */
export function formatLigne(ligne: LigneDevis): string {
  return ligne.statut === "chiffre" && ligne.montant
    ? formatFourchette(ligne.montant)
    : libelleStatut(ligne.statut);
}

export const formatEuros = euros;
