-- ============================================================================
-- RDV — Délai d'appel avant arrivée
-- ============================================================================
-- Ajoute une colonne nullable delai_appel_minutes sur rendez_vous : nombre de
-- minutes avant l'arrivée pendant lesquelles Adrian appellera le client. Saisi
-- manuellement à chaque RDV via /admin/rdv-rapide (presets 15/30/45/60 ou
-- valeur libre). NULL = pas de mention dans les templates SMS/WhatsApp/Email.
-- ============================================================================

ALTER TABLE public.rendez_vous
  ADD COLUMN IF NOT EXISTS delai_appel_minutes integer;

ALTER TABLE public.rendez_vous
  DROP CONSTRAINT IF EXISTS rdv_delai_appel_positif;

ALTER TABLE public.rendez_vous
  ADD CONSTRAINT rdv_delai_appel_positif CHECK (
    delai_appel_minutes IS NULL
    OR (delai_appel_minutes > 0 AND delai_appel_minutes <= 240)
  );

COMMENT ON COLUMN public.rendez_vous.delai_appel_minutes IS
  'Délai en minutes avant arrivée pendant lequel Adrian appelle le client. NULL = mention masquée dans les templates.';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
