import { useGoogleRating } from "./useGoogleRating";
import { useAggregateRating } from "./useAggregateRating";

export interface DisplayRating {
  /** Note moyenne (ex: 5.0) */
  ratingValue: number;
  /** Nombre d'avis */
  reviewCount: number;
  /** Note formatée pour l'UI en français (ex: "5,0") */
  ratingValueFormatted: string;
}

/**
 * SOURCE UNIQUE de tout affichage visible de la note / du nombre d'avis
 * ("X/5 sur Google · Y avis"), pour garantir la cohérence entre tous les blocs
 * (hero, bandeaux home, /avis, pages services, à propos…).
 *
 * Priorité aux chiffres Google saisis manuellement (table `google_rating` via
 * useGoogleRating) ; fallback sur l'agrégat testimonials first-party tant que
 * la table n'est pas remplie, pour ne rien casser.
 *
 * ⚠️ NE PAS utiliser pour le JSON-LD aggregateRating : celui-ci reste branché
 * sur useAggregateRating (testimonials first-party) — cf. décision SEO.
 */
export function useDisplayRating(): { data: DisplayRating | undefined } {
  const { data: google } = useGoogleRating();
  const { data: testimonials } = useAggregateRating();

  if (google) return { data: google };
  if (testimonials) {
    return {
      data: {
        ratingValue: testimonials.ratingValue,
        reviewCount: testimonials.reviewCount,
        ratingValueFormatted: testimonials.ratingValueFormatted,
      },
    };
  }
  return { data: undefined };
}
