import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AggregateRating {
  /** Moyenne calculée arrondie à 2 décimales (ex: 4.94) */
  ratingValue: number;
  /** Nombre d'avis approuvés */
  reviewCount: number;
  /** Moyenne formatée pour affichage UI en français (ex: "4,94") */
  ratingValueFormatted: string;
  /** Moyenne formatée pour Schema.org (ex: "4.94", point décimal) */
  ratingValueSchema: string;
}

/**
 * Valeurs de repli pour l'aggregateRating quand Supabase n'a pas encore
 * répondu (fetch async) ou échoue. Sert aussi de source de vérité pour les
 * compteurs hors-hook (ex: stats hardcodées dans /a-propos).
 *
 * **À garder synchronisé manuellement avec le compteur Google My Business.**
 * 1 endroit, 1 ligne à modifier ici quand le nombre d'avis Google change.
 * La valeur live Supabase écrase ce fallback dès que le hook répond.
 *
 * Le bloc aggregateRating DOIT être présent dans le JSON-LD initial pour
 * que Google affiche les étoiles dans les SERPs même pendant la fenêtre
 * ~100-400ms entre l'hydratation React et la réponse Supabase.
 */
export const FALLBACK_AGGREGATE: AggregateRating = {
  ratingValue: 4.94,
  reviewCount: 23,
  ratingValueFormatted: "4,94",
  ratingValueSchema: "4.94",
};

// Seuil minimal d'avis pour publier l'aggregateRating.
// En-dessous, on ne diffuse pas le bloc Schema.org pour éviter
// d'afficher une note non statistiquement fiable.
const MIN_REVIEWS_FOR_AGGREGATE = 1;

async function fetchAggregateRating(): Promise<AggregateRating | null> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("rating")
    .eq("approved", true);

  if (error || !data || data.length < MIN_REVIEWS_FOR_AGGREGATE) {
    return null;
  }

  const total = data.reduce((sum, row) => sum + (row.rating ?? 0), 0);
  const avg = total / data.length;
  const ratingValue = Math.round(avg * 100) / 100;
  const schemaValue = ratingValue.toFixed(2);

  return {
    ratingValue,
    reviewCount: data.length,
    ratingValueFormatted: schemaValue.replace(".", ","),
    ratingValueSchema: schemaValue,
  };
}

/**
 * Lit dynamiquement la moyenne et le nombre d'avis approuvés depuis Supabase.
 * Utilisé pour synchroniser :
 *  - le Schema.org aggregateRating (LocalBusiness)
 *  - les bandeaux d'avis affichés (home, page /avis)
 *
 * Retourne `null` (data === null) tant qu'il n'y a pas assez d'avis,
 * pour éviter toute incohérence entre l'UI et Schema.org.
 */
export function useAggregateRating() {
  return useQuery({
    queryKey: ["aggregate-rating"],
    queryFn: fetchAggregateRating,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
