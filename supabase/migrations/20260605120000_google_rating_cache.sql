-- ============================================================================
-- GOOGLE_RATING — Cache de la note Google (note + nombre d'avis)
-- ============================================================================
-- Objectif : afficher sur le site les VRAIS chiffres de la fiche Google
-- (note moyenne + nombre total d'avis) et les tenir à jour AUTOMATIQUEMENT,
-- sans exposer la clé Places API côté client.
--
-- Architecture (validée 2026-06-05) :
--   1. Une edge function planifiée `refresh-google-rating` appelle l'API
--      Google Places (Place Details → fields=rating,user_ratings_total) une
--      fois par jour, avec la clé stockée en SECRET Supabase (jamais côté
--      client). Elle UPSERT le résultat dans cette table (singleton id=1).
--   2. Le front lit cette table (lecture publique, rapide, pas de cold start,
--      quota Google négligeable) via le hook `useGoogleRating`.
--
-- Découplage SEO important : le JSON-LD aggregateRating (composant
-- StructuredData) reste alimenté par les `testimonials` first-party — on NE
-- marque PAS en Schema.org une note agrégée tierce (Google), ce que les
-- consignes Google interdisent. Cette table sert UNIQUEMENT l'affichage UI.
-- ============================================================================


-- 1. Table singleton (une seule ligne, id = 1)
CREATE TABLE IF NOT EXISTS public.google_rating (
  id                 SMALLINT     PRIMARY KEY DEFAULT 1,
  place_id           TEXT         NOT NULL,
  rating             NUMERIC(2,1) NOT NULL,
  user_ratings_total INTEGER      NOT NULL,
  fetched_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT google_rating_singleton CHECK (id = 1)
);


-- 2. RLS : lecture publique seule. Les écritures passent par l'edge function
--    avec la clé service_role (qui bypass la RLS) — aucune policy d'écriture
--    publique n'est créée.
ALTER TABLE public.google_rating ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "google_rating public read" ON public.google_rating;
CREATE POLICY "google_rating public read"
  ON public.google_rating
  FOR SELECT
  USING (true);


-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
