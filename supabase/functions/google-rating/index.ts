// Edge function: google-rating
// -----------------------------------------------------------------------------
// Renvoie la note Google LIVE de la fiche Google Business (rating +
// user_ratings_total), avec un cache 24h en base (table google_rating_cache)
// pour limiter les appels Places API (coût + quota).
//
// La clé API n'est JAMAIS exposée côté client : elle vit uniquement ici, en
// secret Supabase. Le client appelle cette fonction via supabase.functions.invoke.
//
// Secrets à configurer (Supabase → Project Settings → Edge Functions → Secrets) :
//   GOOGLE_PLACES_API_KEY      — clé Google Cloud, Places API (New) activée
//   GOOGLE_PLACE_ID            — Place ID de la fiche Google Business
//   SUPABASE_URL               — injecté automatiquement par la plateforme
//   SUPABASE_SERVICE_ROLE_KEY  — injecté automatiquement par la plateforme
//
// Déploiement :
//   supabase functions deploy google-rating
// (verify_jwt = false dans config.toml — appel public depuis la home)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface CachedRating {
  rating: number;
  user_ratings_total: number;
  fetched_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Lire le cache.
  const { data: cached } = await admin
    .from("google_rating_cache")
    .select("rating, user_ratings_total, fetched_at")
    .eq("id", 1)
    .maybeSingle<CachedRating>();

  const isFresh =
    cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;

  if (isFresh) {
    return json({
      rating: cached!.rating,
      userRatingsTotal: cached!.user_ratings_total,
      source: "cache",
    });
  }

  // 2. Cache absent ou périmé → rafraîchir depuis Google Places.
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  const placeId = Deno.env.get("GOOGLE_PLACE_ID");

  // Sert le cache même périmé plutôt que de casser l'affichage.
  const fallbackToCache = (source: string) =>
    cached
      ? json({
          rating: cached.rating,
          userRatingsTotal: cached.user_ratings_total,
          source,
        })
      : json({ error: "google-rating unavailable" }, 503);

  if (!apiKey || !placeId) {
    return fallbackToCache("stale-cache-unconfigured");
  }

  try {
    // Places API (New) — Place Details, field mask limité au strict minimum
    // (rating + userRatingCount) pour minimiser le coût du SKU facturé.
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount",
      },
    });

    if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);

    const place = await res.json();
    const rating = Number(place.rating);
    const total = Number(place.userRatingCount);

    if (!Number.isFinite(rating) || !Number.isFinite(total)) {
      throw new Error("Invalid Places API payload");
    }

    await admin.from("google_rating_cache").upsert({
      id: 1,
      rating,
      user_ratings_total: total,
      fetched_at: new Date().toISOString(),
    });

    return json({ rating, userRatingsTotal: total, source: "google" });
  } catch (err) {
    console.error("google-rating fetch failed:", err);
    return fallbackToCache("stale-cache-error");
  }
});
