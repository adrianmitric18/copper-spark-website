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
  ALERTE_SECURITE,
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
  type Securite,
  type Usage,
  type Zone,
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

  // --- Parcours dépannage ---
  securite?: Securite;
  moment?: Moment;
  zone?: Zone;

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
  /** Intitulé affiché au-dessus du total. */
  intituleTotal: string;
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
  const chiffrees = lignes.filter((l) => l.statut === "chiffre" && l.montant);
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

/** Intitulé du total selon la TVA réellement appliquée. */
const intituleTtc = (age: AgeLogement | undefined): string =>
  age === "moins10"
    ? "Total indicatif, TVA 21 % comprise"
    : "Total indicatif, TVA 6 % comprise";

/** Mention de TVA correspondante. */
const mentionTva = (age: AgeLogement | undefined): string => {
  if (age === "moins10") return MENTIONS.tvaNormale;
  if (age === "plus10") return MENTIONS.tvaReduite;
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
    });
  }

  // 5. L'argument commercial : ce que les autres devis sortent de leur total.
  lignes.push({
    libelle: "Dossier technique et contrôle par l'organisme agréé",
    detail: "Compris dans le prix ci-dessus.",
    statut: "compris",
  });

  const aConfirmer = lignes.some((l) => l.statut === "aConfirmer");

  const mentions: string[] = [MENTIONS.dossierCompris, mentionTva(r.age)];
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
    intituleTotal: intituleTtc(r.age),
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
    RGIE_FORFAIT.precision,
    mentionTva(r.age),
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
    intituleTotal: intituleTtc(r.age),
    aConfirmer: false,
    mentions,
    mentionsRepliees,
  };
}

// =====================================================================
//  Parcours dépannage
// =====================================================================

export const zoneParValeur = (zone: Zone | undefined) =>
  ZONES.find((z) => z.value === zone);

function devisDepannage(r: Reponses): Devis {
  const lignes: LigneDevis[] = [];
  const zone = zoneParValeur(r.zone);
  const moment: Moment = r.moment ?? "journee";

  // 1. Déplacement.
  if (zone && zone.montant !== null) {
    lignes.push({
      libelle: `Déplacement — ${zone.label}`,
      detail: DEPANNAGE.detailDeplacement,
      statut: "chiffre",
      montant: fixe(zone.montant),
    });
  } else {
    lignes.push({
      libelle: "Déplacement",
      detail: "Confirmé par téléphone avant tout départ.",
      statut: "surDevis",
    });
  }

  // 2. Première heure, indivisible.
  lignes.push({
    libelle: DEPANNAGE.libelleMainOeuvre[moment],
    detail: DEPANNAGE.detailPremiereHeure,
    statut: "chiffre",
    montant: fixe(DEPANNAGE.mainOeuvre[moment]),
  });

  // Le total n'a de sens que si le déplacement est connu : sinon on n'affiche
  // pas un « à partir de » qui passerait sous silence la moitié de la facture.
  const horsZone = !zone || zone.montant === null;
  const total = horsZone ? undefined : somme(lignes);

  const mentions: string[] = [
    MENTIONS.depannageHeuresSuivantes,
    MENTIONS.depannageTva,
    MENTIONS.depannageMateriel,
  ];
  if (horsZone) mentions.unshift(MENTIONS.depannageHorsZone);
  if (r.zone === "zone3" && moment === "nuit") {
    mentions.unshift(MENTIONS.depannageNuitZone3);
  }

  return {
    parcours: "depannage",
    complexe: false,
    raisonsComplexe: [],
    lignes,
    total,
    intituleTotal: "À partir de, hors TVA",
    aConfirmer: false,
    mentions,
    mentionsRepliees: [],
  };
}

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
      return devisDepannage(reponses);
  }
}

/** Réexporté pour l'écran d'alerte, qui n'a ni devis ni calcul. */
export { ALERTE_SECURITE };

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
