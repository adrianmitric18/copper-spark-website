-- =============================================================================
-- Simulateur de prix — l'email devient obligatoire
-- =============================================================================
-- Contexte : la migration 20260809120000_simulateur_leads.sql rendait l'email
-- facultatif sur la branche `source = 'simulateur'` (chaîne vide acceptée),
-- pour raccourcir le parcours. Conséquence : l'accusé de réception contenant
-- l'estimation détaillée ne partait pas pour une partie des leads.
--
-- Décision du 2026-08-16 : sur le simulateur, l'email est exigé au même titre
-- que le téléphone, et son format est validé côté base — pas seulement côté
-- client, qui est contournable.
--
-- Cette migration REMPLACE intégralement la policy d'insertion publique. Elle
-- est rejouable (DROP ... IF EXISTS) et ne touche à aucune autre policy.
--
-- Seule différence avec la version précédente : la ligne « email » de la
-- branche simulateur. La branche du formulaire de contact est inchangée.
-- =============================================================================

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
        -- Email OBLIGATOIRE et syntaxiquement valide : c'est lui qui porte
        -- l'estimation détaillée envoyée au client. La chaîne vide, tolérée
        -- jusqu'au 2026-08-16, est désormais refusée.
        -- Réplique de REGEX_EMAIL dans src/lib/simulateur/config.ts : toute
        -- modification de l'une doit être reportée sur l'autre.
        AND char_length(email) BETWEEN 6 AND 255
        AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
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

-- Note : les leads simulateur déjà enregistrés avec un email vide restent en
-- base tels quels. La policy ne porte que sur les INSERT (WITH CHECK), elle ne
-- revalide jamais les lignes existantes.
