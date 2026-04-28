-- ============================================================================
-- PHASE A — RDV RAPIDE
-- ============================================================================
-- Migration nécessaire pour la page /admin/rdv-rapide :
--   1. Restreindre type_visite via CHECK (cohérence stats long terme)
--   2. Ajouter 'rdv_rapide' aux sources autorisées du lead
--   3. Policy RLS d'INSERT leads light pour les RDV rapides
--      (permet de créer un lead minimal en 1 clic, sans tous les champs
--      du formulaire de contact public)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. CHECK type_visite sur rendez_vous
-- ----------------------------------------------------------------------------
-- Liste fixe validée avec l'utilisateur le 2026-04-29 :
--   Devis · Visite technique · Dépannage · Inspection RGIE · Pose borne VE · Autre

ALTER TABLE public.rendez_vous
  DROP CONSTRAINT IF EXISTS rdv_type_visite_valide;

ALTER TABLE public.rendez_vous
  ADD CONSTRAINT rdv_type_visite_valide CHECK (
    type_visite IN (
      'Devis',
      'Visite technique',
      'Dépannage',
      'Inspection RGIE',
      'Pose borne VE',
      'Autre'
    )
  );


-- ----------------------------------------------------------------------------
-- 2. Étendre leads_source_allowed avec 'rdv_rapide'
-- ----------------------------------------------------------------------------

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_allowed;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_source_allowed CHECK (
    source IS NULL OR source IN (
      'formulaire_site',
      'telephone',
      'whatsapp',
      'facebook',
      'recommandation',
      'chantier',
      'autre',
      'Recherche Google',
      'Bouche-à-oreille / Recommandation',
      'Google Maps',
      'Réseaux sociaux',
      'Publicité en ligne',
      'Plateforme (TrustUp, Bobex, Solvari...)',
      'Autre',
      'rdv_rapide'
    )
  );


-- ----------------------------------------------------------------------------
-- 3. Policy RLS d'INSERT leads light pour les RDV rapides
-- ----------------------------------------------------------------------------
-- La policy "Admin can insert leads" existante exige une dizaine de champs
-- (rue, numero, code_postal, services, message, gdpr...) qu'on n'a pas
-- forcément lors d'un RDV pris au téléphone. On ajoute une 2e policy qui
-- accepte un payload minimal, à condition explicite : source='rdv_rapide'
-- ET status='rdv_pris'.
--
-- Postgres RLS combine les policies INSERT en OR : il suffit que l'une des
-- deux soit satisfaite pour autoriser. Aucune fuite de privilège côté
-- formulaire public, qui passe par "Anyone can submit a valid lead".

DROP POLICY IF EXISTS "Admin can insert rdv_rapide leads" ON public.leads;
CREATE POLICY "Admin can insert rdv_rapide leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
  AND source = 'rdv_rapide'
  AND status = 'rdv_pris'
  AND char_length(name) BETWEEN 1 AND 100
  AND char_length(phone) BETWEEN 6 AND 30
  AND gdpr_consent = true
);


-- ============================================================================
-- FIN PHASE A
-- ============================================================================
