-- ============================================================================
-- ALIGNEMENT DES TYPES DE RDV AVEC LES SERVICES DU SITE
-- ============================================================================
-- Le type "Pose borne VE" est remplacé par "Installation borne de recharge"
-- (cohérence avec /services/bornes-de-recharge). Ajout de "Installation
-- panneaux photovoltaïques" pour ouvrir ce flux. Validé le 2026-04-30.
-- ============================================================================


-- 1. Migrer les RDV existants (s'il y en a)
UPDATE public.rendez_vous
SET type_visite = 'Installation borne de recharge'
WHERE type_visite = 'Pose borne VE';


-- 2. DROP l'ancienne contrainte
ALTER TABLE public.rendez_vous
  DROP CONSTRAINT IF EXISTS rdv_type_visite_valide;


-- 3. ADD nouvelle contrainte avec 7 valeurs alignées sur les services
ALTER TABLE public.rendez_vous
  ADD CONSTRAINT rdv_type_visite_valide CHECK (
    type_visite IN (
      'Devis',
      'Visite technique',
      'Dépannage',
      'Inspection RGIE',
      'Installation borne de recharge',
      'Installation panneaux photovoltaïques',
      'Autre'
    )
  );


-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
