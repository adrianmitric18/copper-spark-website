-- =============================================================================
-- Simulateur de prix — leads issus de /simulateur
-- =============================================================================
-- Le simulateur écrit dans la table `leads` existante (source = 'simulateur').
-- Il ne demande PAS d'adresse (l'objectif est de rester sous 45 secondes) et
-- l'email y est facultatif : la policy d'insertion historique, qui exige rue /
-- numéro / code postal / commune / email, doit donc être scindée en deux
-- branches selon la source.
--
-- En contrepartie, la branche simulateur est PLUS stricte sur le téléphone :
-- le GSM belge est validé par expression régulière côté base, en plus du
-- contrôle côté client. C'est la principale barrière anti-spam de ce parcours.
-- =============================================================================

-- 1. Réponses du simulateur -------------------------------------------------
-- Stockées en JSONB : les questions évolueront, une colonne par réponse
-- obligerait une migration à chaque ajustement du parcours.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS payload jsonb;

COMMENT ON COLUMN public.leads.payload IS
  'Réponses brutes du simulateur de prix (source = simulateur) : besoin, distance, installation, usage, fourchette affichée, indicateurs anti-spam. NULL pour les leads du formulaire de contact.';

-- Les leads simulateur sont consultés en filtrant sur la source dans l''admin.
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads (source);

-- 2. Policy d'insertion publique --------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit a valid lead" ON public.leads;

CREATE POLICY "Anyone can submit a valid lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Règles communes aux deux parcours
  gdpr_consent = true
  AND status = 'nouveau'
  AND char_length(name) BETWEEN 1 AND 100
  AND char_length(phone) BETWEEN 6 AND 30
  AND char_length(client_type) BETWEEN 1 AND 50
  AND array_length(services, 1) BETWEEN 1 AND 10
  AND (source IS NULL OR char_length(source) <= 100)
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) <= 3)
  AND (
    CASE
      WHEN source = 'simulateur' THEN
        -- GSM belge obligatoire, avec ou sans préfixe pays.
        phone ~ '^(\+32|0032|0)?4[5-9][0-9]{7}$'
        -- Email facultatif : chaîne vide acceptée (la colonne est NOT NULL).
        AND (email = '' OR char_length(email) BETWEEN 3 AND 255)
        -- Pas d'adresse demandée dans ce parcours.
        AND char_length(address) <= 300
        AND char_length(message) BETWEEN 1 AND 5000
        -- Les réponses sont obligatoires : un lead simulateur sans payload
        -- serait inexploitable pour Adrian.
        AND payload IS NOT NULL
        AND jsonb_typeof(payload) = 'object'
        AND pg_column_size(payload) <= 8192
      ELSE
        -- Formulaire de contact : règles historiques, inchangées.
        char_length(email) BETWEEN 3 AND 255
        AND char_length(address) BETWEEN 3 AND 300
        AND rue IS NOT NULL AND char_length(rue) BETWEEN 1 AND 150
        AND numero IS NOT NULL AND char_length(numero) BETWEEN 1 AND 20
        AND code_postal IS NOT NULL AND char_length(code_postal) = 4 AND code_postal ~ '^[0-9]{4}$'
        AND commune IS NOT NULL AND char_length(commune) BETWEEN 1 AND 100
        AND char_length(message) BETWEEN 10 AND 5000
        AND (timing IS NULL OR char_length(timing) <= 100)
    END
  )
);

-- 3. Rappel : rien d'autre n'est ouvert au public ----------------------------
-- Les policies existantes restent en place et ne sont pas modifiées ici :
--   - anon : INSERT seulement sur leads (aucun SELECT / UPDATE / DELETE)
--   - anon : INSERT seulement sur le bucket 'lead-photos' (lecture refusée)
--   - admin authentifié : lecture / écriture complètes via is_admin()
-- Les photos du simulateur sont rangées sous le préfixe 'simulateur/' de ce
-- même bucket : le parcours réutilise ainsi les policies déjà auditées et
-- l'admin les relit avec le lecteur d'URL signées existant.
