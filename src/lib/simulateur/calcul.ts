/**
 * Simulateur de prix — calcul de la fourchette.
 *
 * Fonction pure, sans effet de bord et sans dépendance React : tout le calcul
 * se fait côté client à partir des constantes de `config.ts`. Aucun appel
 * réseau, aucun tarif codé en dur ici.
 */

import {
  BORNE,
  DISTANCES_COMPLEXES,
  INSTALLATIONS_INCERTAINES,
  MENTIONS,
  RGIE_FORFAIT,
  RGIE_FOURCHETTES,
  SURCOUT_DISTANCE,
  USAGES_COMPLEXES,
  type Besoin,
  type Distance,
  type Installation,
  type Usage,
} from "./config";

export interface ReponsesSimulateur {
  besoin: Besoin;
  /** Renseignée seulement si le besoin inclut une borne. */
  distance?: Distance;
  installation: Installation;
  usage: Usage;
}

export interface Fourchette {
  min: number;
  max: number;
}

export interface Estimation {
  /** true = aucun prix affichable, on bascule sur le métré technique. */
  complexe: boolean;
  /** Raisons lisibles de la bascule en cas complexe. */
  raisonsComplexe: string[];
  /** Fourchette borne, si applicable et non complexe. */
  borne?: Fourchette;
  /** Fourchette RGIE, si applicable. */
  rgie?: Fourchette;
  /** Total affiché au client (somme des fourchettes présentes). */
  total?: Fourchette;
  /** Mentions à afficher sous la fourchette. */
  mentions: string[];
}

const inclutBorne = (besoin: Besoin) => besoin === "borne" || besoin === "combine";
const inclutRgie = (besoin: Besoin) => besoin === "rgie" || besoin === "combine";

/** Arrondi à la dizaine supérieure, pour ne jamais afficher 1 437,50 €. */
const arrondir = (n: number) => Math.ceil(n / 10) * 10;

/**
 * Calcule la fourchette borne.
 *
 * min = base + surcoût de distance
 * max = min × (1 + majoration), plafonné — la majoration est plus forte quand
 * l'état de l'installation est incertain.
 */
function calculBorne(distance: Distance, installation: Installation): Fourchette {
  const surcout = SURCOUT_DISTANCE[distance];
  const majoration = INSTALLATIONS_INCERTAINES.includes(installation)
    ? BORNE.majorationIncertitude
    : BORNE.majorationStandard;

  // Le surcoût de distance a un bas et un haut : quand le visiteur répond
  // « je ne sais pas », la fourchette couvre les deux cas plausibles au lieu
  // de trancher à sa place.
  const socleMin = BORNE.base + surcout.min;
  const socleMax = BORNE.base + surcout.max;

  return {
    min: arrondir(socleMin),
    max: Math.min(arrondir(socleMax * (1 + majoration)), BORNE.plafond),
  };
}

/**
 * Détermine si le projet sort du champ du simulateur. Dans ce cas aucune
 * fourchette n'est produite : afficher un prix sur un chantier qui demande une
 * tranchée ou une copropriété serait un chiffre inventé.
 */
export function detecterComplexite(reponses: ReponsesSimulateur): string[] {
  const raisons: string[] = [];

  if (
    inclutBorne(reponses.besoin) &&
    reponses.distance &&
    DISTANCES_COMPLEXES.includes(reponses.distance)
  ) {
    raisons.push("Distance de plus de 15 m, tranchée ou terrassement à prévoir");
  }

  if (USAGES_COMPLEXES.includes(reponses.usage)) {
    raisons.push("Copropriété ou installation de plusieurs bornes");
  }

  return raisons;
}

export function calculerEstimation(reponses: ReponsesSimulateur): Estimation {
  const raisonsComplexe = detecterComplexite(reponses);
  if (raisonsComplexe.length > 0) {
    return {
      complexe: true,
      raisonsComplexe,
      mentions: [MENTIONS.casComplexe],
    };
  }

  const mentions: string[] = [];
  let borne: Fourchette | undefined;
  let rgie: Fourchette | undefined;

  if (inclutBorne(reponses.besoin) && reponses.distance) {
    borne = calculBorne(reponses.distance, reponses.installation);
    mentions.push(MENTIONS.organismeNonInclus);
  }

  if (inclutRgie(reponses.besoin)) {
    rgie = { ...RGIE_FOURCHETTES[reponses.installation] };
    mentions.push(RGIE_FORFAIT.libelle);
  }

  const total: Fourchette | undefined =
    borne && rgie
      ? { min: borne.min + rgie.min, max: borne.max + rgie.max }
      : (borne ?? rgie);

  if (borne && rgie) mentions.unshift(MENTIONS.estimationGlobale);

  return { complexe: false, raisonsComplexe: [], borne, rgie, total, mentions };
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
 * Quand le haut et le bas sont identiques (cas prévu par le brief : pas de
 * majoration sans incertitude), on affiche « à partir de X » plutôt qu'un
 * montant sec — le simulateur ne doit jamais donner l'impression d'un prix
 * ferme.
 */
export function formatFourchette(f: Fourchette): string {
  return f.min === f.max ? `à partir de ${euros(f.min)}` : `${euros(f.min)} – ${euros(f.max)}`;
}

export const formatEuros = euros;
