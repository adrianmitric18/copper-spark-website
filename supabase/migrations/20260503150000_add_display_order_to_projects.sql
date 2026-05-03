-- ============================================================================
-- DISPLAY_ORDER — Ordre éditorial des chantiers (admin drag-drop)
-- ============================================================================
-- Phase 2 du CMS Chantiers : Adrian veut pouvoir réorganiser les chantiers
-- de /realisations via drag-drop dans /admin/chantiers, sans bidouiller les
-- dates completed_at (qui doivent rester sémantiquement = date de fin de
-- chantier).
--
-- Stratégie :
--   1. ADD COLUMN display_order INT NOT NULL DEFAULT 0
--   2. INDEX partiel (display_order, completed_at DESC) WHERE deleted_at IS NULL
--      → couvre la requête publique principale (cf. fetchPublishedProjects)
--   3. Backfill des chantiers existants par ROW_NUMBER() * 10 selon l'ordre
--      d'affichage actuel (completed_at DESC, created_at ASC). Multiplier
--      par 10 permet d'insérer un chantier "entre deux" sans renuméroter
--      l'ensemble (ex: insérer à 15 entre 10 et 20).
--
-- Side-effect noté : le trigger update_projects_updated_at va bumper
-- updated_at sur les rows backfillées. Acceptable.
-- ============================================================================


-- 1. Colonne
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;


-- 2. Index partiel pour la requête publique (status='published' AND deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS projects_display_order_idx
  ON public.projects (display_order, completed_at DESC)
  WHERE deleted_at IS NULL;


-- 3. Backfill : préserve l'ordre actuel d'affichage
WITH numbered AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (ORDER BY completed_at DESC, created_at ASC) * 10)::int AS new_order
  FROM public.projects
  WHERE deleted_at IS NULL
)
UPDATE public.projects p
SET display_order = numbered.new_order
FROM numbered
WHERE p.id = numbered.id;


-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
