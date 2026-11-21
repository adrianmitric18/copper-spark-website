import { useGoogleRating } from "./useGoogleRating";
import { useAggregateRating } from "./useAggregateRating";

export interface DisplayRating {
  /** Note moyenne (ex: 5.0) */
  ratingValue: number;
  /** Nombre d'avis */
  reviewCount: number;
  /** Note formatée pour l'UI en français (ex: "5,0") */
  ratingValueFormatted: string;
  /** true tant que la valeur affichée est la valeur de secours statique. */
  isFallback?: boolean;
}

/**
 * Valeur de secours statique, affichée immédiatement au premier rendu.
 *
 * Pourquoi : la note vient de Supabase (requête réseau). Tant qu'elle n'est pas
 * arrivée — ou si la requête échoue — la note disparaissait complètement de la
 * page : ni le visiteur ni le crawler Google ne la voyaient. Un chiffre présent
 * dès le HTML rendu vaut mieux qu'un bloc vide.
 *
 * À tenir à jour manuellement avec la fiche Google (source : /admin/avis).
 */
export const FALLBACK_RATING: DisplayRating = {
  ratingValue: 5.0,
  // Relevé sur la fiche Google le 2026-09-14.
  reviewCount: 33,
  ratingValueFormatted: "5,0",
  isFallback: true,
};

/**
 * Note de la fiche Google lue dans la table `google_rating` AU MOMENT DU BUILD
 * (scripts/realisations-data.mjs → constante `__GOOGLE_RATING__`). C'est elle
 * qui se retrouve dans le HTML pré-rendu, où Supabase est coupé : le nombre
 * d'avis lu par Google et les IA est donc celui de la table, plus la constante
 * ci-dessus. `null` si le build n'a pas pu lire la table.
 */
const ratingDuBuild = typeof __GOOGLE_RATING__ !== "undefined" ? __GOOGLE_RATING__ : null;

export const BUILD_RATING: DisplayRating | null = ratingDuBuild
  ? {
      ratingValue: ratingDuBuild.rating,
      reviewCount: ratingDuBuild.total,
      ratingValueFormatted: ratingDuBuild.rating.toFixed(1).replace(".", ","),
    }
  : null;

/**
 * SOURCE UNIQUE de tout affichage visible de la note / du nombre d'avis
 * ("X/5 sur Google · Y avis"), pour garantir la cohérence entre tous les blocs
 * (hero, bandeaux home, /avis, pages services, à propos…).
 *
 * Priorité aux chiffres Google saisis manuellement (table `google_rating` via
 * useGoogleRating) ; fallback sur l'agrégat testimonials first-party tant que
 * la table n'est pas remplie. Tant qu'aucune requête n'a abouti (premier
 * rendu, pré-rendu, panne réseau) : la note lue au build (BUILD_RATING), et en
 * tout dernier recours FALLBACK_RATING — la note reste ainsi toujours visible.
 *
 * `data` n'est donc jamais `undefined` : les appelants n'ont plus besoin de
 * masquer leur bloc. Utiliser `data.isFallback` pour distinguer la valeur de
 * secours de la vraie donnée.
 *
 * ⚠️ NE PAS utiliser pour le JSON-LD aggregateRating : celui-ci reste branché
 * sur useAggregateRating (testimonials first-party) — cf. décision SEO.
 */
export function useDisplayRating(): { data: DisplayRating } {
  const { data: google } = useGoogleRating();
  const { data: testimonials } = useAggregateRating();

  if (google) return { data: google };
  // Avant l'agrégat des témoignages : sinon le nombre d'avis sauterait de la
  // valeur Google du build à celle des témoignages, puis reviendrait.
  if (BUILD_RATING) return { data: BUILD_RATING };
  if (testimonials) {
    return {
      data: {
        ratingValue: testimonials.ratingValue,
        reviewCount: testimonials.reviewCount,
        ratingValueFormatted: testimonials.ratingValueFormatted,
      },
    };
  }
  return { data: FALLBACK_RATING };
}
