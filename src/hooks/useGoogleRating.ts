import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleRating {
  /** Note Google brute (ex : 5 ou 4.9). */
  rating: number;
  /** Nombre total d'avis Google. */
  userRatingsTotal: number;
  /** Note formatée FR pour l'UI (ex : "5,0"). */
  ratingFormatted: string;
}

/**
 * Valeur de repli affichée tant que l'edge function `google-rating` n'a pas
 * répondu (fetch async) ou si elle échoue. À garder ≈ à la fiche Google réelle.
 * La valeur live (Places API via edge function, cache 24h) l'écrase dès
 * qu'elle arrive.
 */
export const FALLBACK_GOOGLE_RATING: GoogleRating = {
  rating: 5,
  userRatingsTotal: 25,
  ratingFormatted: "5,0",
};

const formatRating = (rating: number): string => rating.toFixed(1).replace(".", ",");

async function fetchGoogleRating(): Promise<GoogleRating> {
  const { data, error } = await supabase.functions.invoke("google-rating");

  if (error || !data || typeof data.rating !== "number") {
    return FALLBACK_GOOGLE_RATING;
  }

  return {
    rating: data.rating,
    userRatingsTotal: Number(data.userRatingsTotal) || FALLBACK_GOOGLE_RATING.userRatingsTotal,
    ratingFormatted: formatRating(data.rating),
  };
}

/**
 * Note Google LIVE (note + nombre d'avis) pour l'affichage VISIBLE de la home
 * (bandeau d'avis, figure "Note Google"). Source : edge function `google-rating`
 * (Google Places API, cache 24h en base) — la clé API reste côté serveur.
 *
 * ⚠️ N'alimente PAS le JSON-LD aggregateRating : celui-ci reste branché sur les
 * testimonials Supabase (cf. useAggregateRating) pour respecter les règles
 * rich-results Google (avis collectés par le site, pas réimportés de Google).
 */
export function useGoogleRating() {
  return useQuery({
    queryKey: ["google-rating"],
    queryFn: fetchGoogleRating,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}
