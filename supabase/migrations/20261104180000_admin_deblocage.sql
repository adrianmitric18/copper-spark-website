-- ============================================================================
-- ADMIN — DÉBLOCAGE (lot 1A du brief admin 2026-11-04)
-- ============================================================================
-- Règles : rien d'obligatoire sauf nom + téléphone ; aucune règle de date
-- bloquante ; l'email n'est jamais bloquant.
--
-- 1. validate_rdv_date() refusait toute ligne de rendez_vous dont la date est
--    passée, y compris un simple changement de statut : un RDV passé ne pouvait
--    plus être annulé, modifié ni clôturé. La même fonction servait de trigger
--    updated_at à checklist_items (sans colonne date_rdv) → cocher une case
--    plantait (« record "new" has no field "date_rdv" »).
-- 2. rdv_heure_valide bloquait avant 7 h et après 22 h.
-- 3. leads : email / adresse / message / type de client deviennent facultatifs ;
--    une policy admin d'insertion générale remplace celle limitée à rdv_rapide ;
--    les placeholders des anciens leads sont nettoyés.
--
-- Idempotent : relançable sans risque.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Fonction updated_at générique
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. rendez_vous : plus aucun refus de date passée, plus de plage horaire imposée
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_validate_rdv_date ON public.rendez_vous;
DROP TRIGGER IF EXISTS trg_rdv_updated_at ON public.rendez_vous;
CREATE TRIGGER trg_rdv_updated_at
  BEFORE UPDATE ON public.rendez_vous
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rendez_vous DROP CONSTRAINT IF EXISTS rdv_heure_valide;
-- Conservés : rdv_statut_valide, rdv_duree_valide.

-- ----------------------------------------------------------------------------
-- 3. checklist_items : le trigger qui plantait
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON public.checklist_items;
CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Plus aucun trigger ne l'utilise (vérifié : grep validate_rdv_date supabase/).
DROP FUNCTION IF EXISTS public.validate_rdv_date();

-- ----------------------------------------------------------------------------
-- 4. leads : email / adresse / message / type de client facultatifs
-- ----------------------------------------------------------------------------
ALTER TABLE public.leads
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN message DROP NOT NULL,
  ALTER COLUMN client_type DROP NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. leads : policy admin d'insertion GÉNÉRALE
--    Remplace « Admin can insert rdv_rapide leads » (source = 'rdv_rapide' et
--    statut = 'rdv_pris' seulement) et couvre aussi le lead créé à la main.
--    La policy publique « Anyone can submit a valid lead » reste telle quelle.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin can insert rdv_rapide leads" ON public.leads;
DROP POLICY IF EXISTS "Admin can insert leads" ON public.leads;
CREATE POLICY "Admin can insert leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- 6. Nettoyage des placeholders des anciens leads (valeurs générées par
--    src/lib/admin/rdv-rapide.ts avant ce lot). Ils restaient dans le CSV, les
--    mailto et les écrans. hasUsableEmail les filtre encore côté client au cas où.
-- ----------------------------------------------------------------------------
UPDATE public.leads
   SET email = NULL
 WHERE email ILIKE '%@local.cuivre-electrique.com'
    OR lower(btrim(email)) IN ('non fourni', '');

UPDATE public.leads
   SET address = NULL
 WHERE lower(btrim(address)) IN ('à préciser', 'a préciser', 'non fourni', '—', '-', '');

UPDATE public.leads
   SET message = NULL
 WHERE message LIKE 'Lead créé par téléphone le %'
    OR message LIKE 'RDV % pris par téléphone le %'
    OR btrim(message) IN ('—', '-', '');

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
