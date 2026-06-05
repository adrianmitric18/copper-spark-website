// ============================================================================
// Edge function : refresh-google-rating
// ============================================================================
// Récupère la note Google (rating + user_ratings_total) via l'API Google
// Places "Place Details" et la met en cache dans la table public.google_rating
// (ligne singleton id=1). À déclencher 1x/jour via un scheduler (pg_cron ou
// planificateur Supabase) — voir le README de déploiement.
//
// La clé Places API n'est JAMAIS exposée au client : elle vit en secret
// Supabase (GOOGLE_PLACES_API_KEY). L'écriture en base se fait avec la clé
// service_role (bypass RLS).
//
// Variables d'environnement (secrets Supabase à configurer) :
//   - GOOGLE_PLACES_API_KEY  : clé API Google Cloud (Places API activée)
//   - GOOGLE_PLACE_ID        : place_id de la fiche Google "Le Cuivre Électrique"
//   - SUPABASE_URL           : injecté automatiquement par Supabase
//   - SUPABASE_SERVICE_ROLE_KEY : injecté automatiquement par Supabase
//
// Config recommandée (supabase/config.toml) :
//   [functions.refresh-google-rating]
//   verify_jwt = true        # appelable uniquement avec un token service_role
// ============================================================================

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const placeId = Deno.env.get("GOOGLE_PLACE_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !placeId || !supabaseUrl || !serviceKey) {
      return json({ error: "Configuration manquante (clé API, place_id ou env Supabase)." }, 500);
    }

    // 1. Appel Google Places — on ne demande QUE rating + user_ratings_total.
    const placesUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    placesUrl.searchParams.set("place_id", placeId);
    placesUrl.searchParams.set("fields", "rating,user_ratings_total");
    placesUrl.searchParams.set("language", "fr");
    placesUrl.searchParams.set("key", apiKey);

    const placesRes = await fetch(placesUrl.toString());
    const placesData = await placesRes.json();

    if (placesData.status !== "OK") {
      return json(
        { error: "Réponse Google Places invalide", status: placesData.status, message: placesData.error_message },
        502,
      );
    }

    const rating = placesData.result?.rating;
    const userRatingsTotal = placesData.result?.user_ratings_total;

    if (typeof rating !== "number" || typeof userRatingsTotal !== "number") {
      return json({ error: "Champs rating/user_ratings_total absents de la réponse Google." }, 502);
    }

    // 2. UPSERT dans la table cache (singleton id=1) via PostgREST + service_role.
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/google_rating?on_conflict=id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: 1,
        place_id: placeId,
        rating,
        user_ratings_total: userRatingsTotal,
        fetched_at: new Date().toISOString(),
      }),
    });

    if (!upsertRes.ok) {
      const detail = await upsertRes.text();
      return json({ error: "Échec de l'écriture en base", detail }, 500);
    }

    return json({ ok: true, rating, user_ratings_total: userRatingsTotal });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
