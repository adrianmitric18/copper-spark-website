-- ============================================================================
-- LEADS — autoriser la source « simulateur »
-- ============================================================================
-- Constat du 2026-11-22 : aucune demande du simulateur n'a jamais été
-- enregistrée dans la table `leads`. Le simulateur écrit `source = 'simulateur'`
-- (obligatoire : c'est cette valeur qui fait choisir la bonne branche de la
-- policy d'insertion), mais la contrainte `leads_source_allowed`, créée en
-- avril 2026 puis étendue pour `rdv_rapide`, n'a jamais reçu cette valeur.
-- La base répondait donc :
--   23514 new row for relation "leads" violates check constraint "leads_source_allowed"
-- Le visiteur voyait quand même son estimation et les e-mails partaient, avec la
-- mention « ECHEC BASE — lead à ré-encoder à la main » dans celui d'Adrian.
--
-- Cette migration recrée la contrainte avec la même liste, plus 'simulateur'.
-- Aucune ligne existante n'est modifiée ; toutes respectent déjà la nouvelle
-- liste, qui contient l'ancienne.
--
-- Pour revenir en arrière : rejouer le bloc 2 de
-- 20260429100000_rdv_rapide_phase_a.sql (la même liste sans 'simulateur').
-- ============================================================================

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
      'rdv_rapide',
      'simulateur'
    )
  );

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
