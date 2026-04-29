-- ============================================================================
-- INTERVENTIONS — Programmation de chantiers
-- ============================================================================
-- Table dédiée aux chantiers programmés (multi-jours) après acceptation
-- d'un devis. Distinct de rendez_vous (RDV exploratoires ponctuels) et de
-- projects (CMS vitrine /realisations).
--
-- Une intervention peut être liée à un project (chantier vitrine) via la
-- FK nullable project_id, créée lors de l'action "Transformer en chantier
-- vitrine" sur la fiche intervention.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,

  type_intervention text NOT NULL,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  heure_debut time NOT NULL,
  heure_fin time NOT NULL,

  notes_client text,
  notes_internes text,

  statut text NOT NULL DEFAULT 'programme',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT interventions_type_valide CHECK (
    type_intervention IN (
      'Devis',
      'Visite technique',
      'Dépannage',
      'Inspection RGIE',
      'Installation borne de recharge',
      'Installation panneaux photovoltaïques',
      'Autre'
    )
  ),
  CONSTRAINT interventions_statut_valide CHECK (
    statut IN ('programme', 'en_cours', 'termine', 'reporte', 'annule')
  ),
  CONSTRAINT interventions_dates_coherentes CHECK (date_fin >= date_debut),
  CONSTRAINT interventions_heures_coherentes CHECK (
    -- même jour → heure_fin > heure_debut
    -- multi-jours → pas de contrainte sur les heures (ex: J1 8h-17h, J2 8h-17h)
    date_fin > date_debut OR heure_fin > heure_debut
  ),
  CONSTRAINT interventions_notes_client_length CHECK (
    notes_client IS NULL OR char_length(notes_client) <= 2000
  ),
  CONSTRAINT interventions_notes_internes_length CHECK (
    notes_internes IS NULL OR char_length(notes_internes) <= 2000
  )
);

CREATE INDEX IF NOT EXISTS idx_interventions_lead_id     ON public.interventions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interventions_project_id  ON public.interventions(project_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date_debut  ON public.interventions(date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_statut      ON public.interventions(statut);

-- updated_at auto via trigger (réutilise la fonction is_admin / pattern existants)
CREATE OR REPLACE FUNCTION public.touch_interventions_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS interventions_set_updated_at ON public.interventions;
CREATE TRIGGER interventions_set_updated_at
  BEFORE UPDATE ON public.interventions
  FOR EACH ROW EXECUTE FUNCTION public.touch_interventions_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — admin only (pattern identique à rendez_vous)
-- ----------------------------------------------------------------------------
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on interventions" ON public.interventions;
CREATE POLICY "Admin full access on interventions"
  ON public.interventions
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
