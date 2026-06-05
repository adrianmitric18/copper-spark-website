import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleRating {
  /** Note moyenne Google (ex: 5.0) */
  ratingValue: number;
  /** Nombre total d'avis Google (user_ratings_total) */
  reviewCount: number;
  /** Note formatée pour l'UI en français, 1 décimale (ex: "5,0") */
  ratingValueFormatted: string;
}

// La table `google_rating` n'est pas (encore) dans les types générés Supabase.
// On lit via un client non typé pour ne pas casser le typecheck tant que les
// types ne sont pas régénérés. À régénérer après application de la migration :
//   npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts
const db = supabase as unknown as SupabaseClient;

async function fetchGoogleRating(): Promise<GoogleRating | null> {
  const { data, error } = await db
    .from("google_rating")
    .select("rating, user_ratings_total")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return null;

  const ratingValue = Number(data.rating);
  const reviewCount = Number(data.user_ratings_total);
  if (!Number.isFinite(ratingValue) || !Number.isFinite(reviewCount)) return null;

  return {
    ratingValue,
    reviewCount,
    ratingValueFormatted: ratingValue.toFixed(1).replace(".", ","),
  };
}

/**
 * Lit les VRAIS chiffres de la fiche Google (note + nombre d'avis) depuis la
 * table cache `google_rating`, alimentée 1x/jour par l'edge function
 * `refresh-google-rating`.
 *
 * Retourne `null` tant que le cache n'est pas alimenté → l'appelant retombe
 * alors sur `useAggregateRating` (testimonials) pour ne rien casser.
 *
 * ⚠️ Réservé à l'AFFICHAGE UI. Le JSON-LD aggregateRating reste, lui, basé sur
 * les avis first-party (useAggregateRating) — on ne marque pas en Schema.org
 * une note agrégée tierce (consignes Google).
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
