-- ============================================================================
-- GOOGLE_RATING — Chiffres Google affichés sur le site (saisie manuelle admin)
-- ============================================================================
-- Objectif : afficher les vrais chiffres de la fiche Google (note + nombre
-- d'avis) sur la home.
--
-- Pourquoi en manuel : « Le Cuivre Électrique » est un établissement
-- *zone de service* (électricien sans adresse vitrine). Ces fiches ne sont
-- servies par AUCUNE API Places (ni legacy ni « New ») et les place_id dérivés
-- du CID sont dépréciés → l'auto-fetch est impossible côté Google. On saisit
-- donc note + nombre d'avis à la main depuis /admin/avis.
--
-- Le front (hook useGoogleRating) lit cette table ; si elle est vide, il
-- retombe sur les testimonials first-party (useAggregateRating).
-- Découplage SEO : le JSON-LD aggregateRating (StructuredData) reste, lui,
-- basé sur les testimonials — on ne marque pas une note agrégée tierce.
-- ============================================================================


-- 1. Table singleton (une seule ligne, id = 1)
CREATE TABLE IF NOT EXISTS public.google_rating (
  id                 SMALLINT     PRIMARY KEY DEFAULT 1,
  rating             NUMERIC(2,1) NOT NULL,
  user_ratings_total INTEGER      NOT NULL,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT google_rating_singleton CHECK (id = 1)
);


-- 2. RLS
ALTER TABLE public.google_rating ENABLE ROW LEVEL SECURITY;

-- Lecture publique (affichage sur le site)
DROP POLICY IF EXISTS "google_rating public read" ON public.google_rating;
CREATE POLICY "google_rating public read"
  ON public.google_rating FOR SELECT
  USING (true);

-- Écriture réservée aux admins connectés (même modèle que les autres tables admin)
DROP POLICY IF EXISTS "google_rating admin insert" ON public.google_rating;
CREATE POLICY "google_rating admin insert"
  ON public.google_rating FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "google_rating admin update" ON public.google_rating;
CREATE POLICY "google_rating admin update"
  ON public.google_rating FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);


-- 3. Seed initial (5,0 / 25 avis) pour affichage immédiat
INSERT INTO public.google_rating (id, rating, user_ratings_total)
VALUES (1, 5.0, 25)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
