-- Table rendez_vous
CREATE TABLE public.rendez_vous (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  date_rdv DATE NOT NULL,
  heure_rdv TIME NOT NULL,
  duree_minutes INTEGER NOT NULL DEFAULT 60,
  type_visite TEXT NOT NULL,
  notes_internes TEXT,
  statut TEXT NOT NULL DEFAULT 'confirme',
  rappel_envoye_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rdv_statut_valide CHECK (statut IN ('confirme','rappel_envoye','termine','annule')),
  CONSTRAINT rdv_duree_valide CHECK (duree_minutes BETWEEN 15 AND 480),
  CONSTRAINT rdv_heure_valide CHECK (heure_rdv >= '07:00:00' AND heure_rdv <= '22:00:00')
);

-- Validation date >= aujourd'hui via trigger (CHECK ne peut pas utiliser now())
CREATE OR REPLACE FUNCTION public.validate_rdv_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_rdv < CURRENT_DATE THEN
    RAISE EXCEPTION 'La date du rendez-vous ne peut pas être dans le passé';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_rdv_date
BEFORE INSERT OR UPDATE ON public.rendez_vous
FOR EACH ROW EXECUTE FUNCTION public.validate_rdv_date();

-- Index
CREATE INDEX idx_rdv_lead_id ON public.rendez_vous(lead_id);
CREATE INDEX idx_rdv_date_statut ON public.rendez_vous(date_rdv, statut);

-- RLS
ALTER TABLE public.rendez_vous ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select rdv"
ON public.rendez_vous FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admin can insert rdv"
ON public.rendez_vous FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update rdv"
ON public.rendez_vous FOR UPDATE TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin can delete rdv"
ON public.rendez_vous FOR DELETE TO authenticated
USING (is_admin());

CREATE POLICY "Deny anon all on rdv"
ON public.rendez_vous FOR ALL TO anon
USING (false) WITH CHECK (false);