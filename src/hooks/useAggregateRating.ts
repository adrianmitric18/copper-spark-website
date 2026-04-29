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
