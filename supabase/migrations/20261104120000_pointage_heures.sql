-- ============================================================================
-- POINTAGE HEURES — Heures, km et forfaits de l'électricien (admin seul)
-- ============================================================================
-- Remplace le pointage local de vertuoza-tools (exports/heures.csv) par deux
-- tables Supabase, lues et écrites uniquement par l'admin connecté
-- (page /admin/heures). Aucun usage côté site public.
--
-- `heures`    : une ligne par pointage (date, type, chantier, horaires, km…).
-- `chantiers` : référentiel des noms de chantier saisis (créé à la volée à la
--               première saisie), avec les heures prévues du devis et les km
--               par défaut. Distinct de `projects` (réalisations vitrine) et
--               de `interventions` (chantiers programmés depuis un lead).
--
-- Le CSV exporté reprend les 8 premières colonnes du fichier heures.csv de
-- vertuoza-tools (date;chantier;debut;fin;pause;heures_nettes;km;note) puis
-- type;forfait_eur.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. chantiers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chantiers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom            text NOT NULL UNIQUE,
  heures_prevues numeric(7,2),
  km_defaut      numeric(6,1),
  actif          boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chantiers_nom_non_vide CHECK (char_length(btrim(nom)) BETWEEN 1 AND 120),
  CONSTRAINT chantiers_heures_prevues_positives CHECK (heures_prevues IS NULL OR heures_prevues >= 0),
  CONSTRAINT chantiers_km_defaut_positif CHECK (km_defaut IS NULL OR km_defaut >= 0)
);

-- « Wemmel » et « wemmel » désignent le même chantier.
CREATE UNIQUE INDEX IF NOT EXISTS chantiers_nom_lower_key ON public.chantiers (lower(nom));

-- ----------------------------------------------------------------------------
-- 2. heures
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.heures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  type          text NOT NULL,
  chantier      text NOT NULL,
  debut         time,
  fin           time,
  pause_min     integer NOT NULL DEFAULT 30,
  heures_nettes numeric(5,2) NOT NULL DEFAULT 0,
  km            numeric(6,1),
  forfait_eur   numeric(8,2),
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT heures_type_valide CHECK (type IN ('chantier', 'forfait', 'deplacement')),
  CONSTRAINT heures_chantier_non_vide CHECK (char_length(btrim(chantier)) BETWEEN 1 AND 120),
  -- début et fin vont ensemble ; facultatifs uniquement pour un déplacement
  CONSTRAINT heures_debut_fin_ensemble CHECK ((debut IS NULL) = (fin IS NULL)),
  CONSTRAINT heures_horaires_requis CHECK (type = 'deplacement' OR debut IS NOT NULL),
  -- fin < debut = fin le lendemain (dépannage de nuit 22:00 → 01:30) ; seule
  -- l'égalité est refusée (durée nulle ou 24 h ambiguë).
  CONSTRAINT heures_fin_differente CHECK (debut IS NULL OR fin <> debut),
  CONSTRAINT heures_pause_positive CHECK (pause_min >= 0),
  CONSTRAINT heures_nettes_positives CHECK (heures_nettes >= 0),
  CONSTRAINT heures_km_positif CHECK (km IS NULL OR km >= 0),
  CONSTRAINT heures_forfait_positif CHECK (forfait_eur IS NULL OR forfait_eur >= 0),
  CONSTRAINT heures_note_length CHECK (note IS NULL OR char_length(note) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_heures_date ON public.heures (date DESC);
CREATE INDEX IF NOT EXISTS idx_heures_chantier ON public.heures (lower(chantier));

-- Doublon refusé : même date + même chantier + mêmes heures (début/fin absents
-- comptés comme 00:00 pour qu'un déplacement sans horaire soit couvert aussi).
CREATE UNIQUE INDEX IF NOT EXISTS heures_doublon_key
  ON public.heures (date, lower(chantier), COALESCE(debut, time '00:00'), COALESCE(fin, time '00:00'));

CREATE OR REPLACE FUNCTION public.touch_heures_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS heures_set_updated_at ON public.heures;
CREATE TRIGGER heures_set_updated_at
  BEFORE UPDATE ON public.heures
  FOR EACH ROW EXECUTE FUNCTION public.touch_heures_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RLS — admin uniquement (même modèle que interventions / rendez_vous)
-- ----------------------------------------------------------------------------
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heures    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on chantiers" ON public.chantiers;
CREATE POLICY "Admin full access on chantiers"
  ON public.chantiers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin full access on heures" ON public.heures;
CREATE POLICY "Admin full access on heures"
  ON public.heures
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
