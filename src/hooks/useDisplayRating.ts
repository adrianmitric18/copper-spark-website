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
  reviewCount: 32,
  ratingValueFormatted: "5,0",
  isFallback: true,
};

/**
 * SOURCE UNIQUE de tout affichage visible de la note / du nombre d'avis
 * ("X/5 sur Google · Y avis"), pour garantir la cohérence entre tous les blocs
 * (hero, bandeaux home, /avis, pages services, à propos…).
 *
 * Priorité aux chiffres Google saisis manuellement (table `google_rating` via
 * useGoogleRating) ; fallback sur l'agrégat testimonials first-party tant que
 * la table n'est pas remplie, puis sur FALLBACK_RATING (constante statique) si
 * aucune des deux requêtes n'a abouti — la note reste ainsi toujours visible.
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
