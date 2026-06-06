-- ============================================================================
-- UNIFICATION DES TYPES DE VISITE RDV — 13 libellés
-- ============================================================================
-- Source unique : src/lib/rdv/constants.ts (TYPES_VISITE).
-- La fiche lead et RDV rapide partagent désormais la même liste de 13 libellés.
-- La contrainte rdv_type_visite_valide est réalignée dessus.
--
-- ⚠️ La table `interventions` garde sa PROPRE liste (7 valeurs,
--    contrainte interventions_type_valide) — non modifiée ici.
-- ============================================================================


-- 1. Migrer les lignes existantes.
-- Répartition réelle constatée en prod (2026-06-06, 6 lignes) :
--   Devis = 3, Visite technique = 1, Autre = 2.
-- Aucune ligne borne/PV/RGIE/Dépannage → pas de remapping topique à faire.
-- Les deux types génériques au service inconnu (Devis, Visite technique) sont
-- versés en 'Autre' (pas de libellé spécifique fabriqué sur une visite floue).
-- 'Autre' reste 'Autre' (déjà dans les 13). Aucune autre valeur à traiter.
UPDATE public.rendez_vous
SET type_visite = 'Autre'
WHERE type_visite IN ('Devis', 'Visite technique');


-- 2. Filet de sécurité : tout libellé encore hors des 13 retombe sur 'Autre'
--    (sinon l'ADD CONSTRAINT échouerait sur une ligne non conforme).
UPDATE public.rendez_vous
SET type_visite = 'Autre'
WHERE type_visite NOT IN (
  'Visite devis - Mise en conformité RGIE',
  'Visite devis - Installation électrique complète',
  'Visite devis - Rénovation électrique',
  'Visite devis - Remplacement tableau électrique',
  'Visite devis - Borne de recharge voiture électrique',
  'Visite devis - Panneaux photovoltaïques',
  'Visite devis - Éclairage intérieur/extérieur',
  'Visite devis - Câblage informatique RJ45',
  'Visite devis - Parlophonie/vidéophonie',
  'Visite devis - Contrat de maintenance Pro',
  'Intervention - Dépannage',
  'Intervention - Chantier confirmé',
  'Autre'
);


-- 3. Remplacer la contrainte CHECK par la liste des 13 libellés.
ALTER TABLE public.rendez_vous
  DROP CONSTRAINT IF EXISTS rdv_type_visite_valide;

ALTER TABLE public.rendez_vous
  ADD CONSTRAINT rdv_type_visite_valide CHECK (
    type_visite IN (
      'Visite devis - Mise en conformité RGIE',
      'Visite devis - Installation électrique complète',
      'Visite devis - Rénovation électrique',
      'Visite devis - Remplacement tableau électrique',
      'Visite devis - Borne de recharge voiture électrique',
      'Visite devis - Panneaux photovoltaïques',
      'Visite devis - Éclairage intérieur/extérieur',
      'Visite devis - Câblage informatique RJ45',
      'Visite devis - Parlophonie/vidéophonie',
      'Visite devis - Contrat de maintenance Pro',
      'Intervention - Dépannage',
      'Intervention - Chantier confirmé',
      'Autre'
    )
  );

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
