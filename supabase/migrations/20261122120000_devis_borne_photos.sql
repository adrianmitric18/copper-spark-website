-- ============================================================================
-- DEVIS BORNE AVEC PHOTOS — origine « devis_borne », 5 photos, limites du stockage
-- ============================================================================
-- Pour le formulaire /devis-borne (demande du 2026-11-22). Trois changements,
-- aucun sur les lignes existantes :
--
-- 1. `leads_source_allowed` : ajoute l'origine 'devis_borne'. C'est l'oubli de
--    cette étape qui a empêché le simulateur d'enregistrer d'août à novembre.
--
-- 2. Policy d'insertion publique « Anyone can submit a valid lead » : un
--    troisième cas pour 'devis_borne'. Les deux cas existants (simulateur,
--    formulaire de contact) sont recopiés À L'IDENTIQUE. Deux règles communes
--    sont déplacées pour laisser passer le nouveau cas, sans rien changer pour
--    les deux autres :
--      - téléphone de 6 à 30 caractères  → reste obligatoire pour le simulateur
--        et le formulaire ; pour 'devis_borne' il faut un téléphone OU un e-mail ;
--      - 3 photos au maximum              → reste 3 pour le simulateur et le
--        formulaire ; 5 pour 'devis_borne'.
--    Pour 'devis_borne' : nom, téléphone ou e-mail, code postal à 4 chiffres,
--    service imposé « Borne de recharge voiture électrique », réponses dans
--    `payload`. Rien d'autre n'est obligatoire.
--
-- 3. Stockage `lead-photos` : jusqu'ici le dossier acceptait n'importe quel
--    fichier, de n'importe quelle taille. Désormais : images seulement
--    (JPEG, PNG, WebP, HEIC/HEIF des iPhone) et 8 Mo au maximum par fichier.
--    Le dossier reste privé : lecture réservée à l'admin, aucune adresse publique.
--    Les limites valent aussi pour le simulateur et le formulaire de contact,
--    qui réduisent déjà leurs photos avant l'envoi (8 Mo et 5 Mo au maximum).
--
-- Rejouable sans risque. Pour revenir en arrière :
--   - rejouer 20261122100000_leads_source_simulateur.sql (liste sans 'devis_borne') ;
--   - rejouer la policy de 20260816120000_simulateur_email_obligatoire.sql ;
--   - UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL
--     WHERE id = 'lead-photos';
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Origine acceptée
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
      'rdv_rapide',
      'simulateur',
      'devis_borne'
    )
  );

-- ----------------------------------------------------------------------------
-- 2. Policy d'insertion publique
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit a valid lead" ON public.leads;

CREATE POLICY "Anyone can submit a valid lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Règles communes aux trois parcours
  gdpr_consent = true
  AND status = 'nouveau'
  AND char_length(name) BETWEEN 1 AND 100
  AND char_length(client_type) BETWEEN 1 AND 50
  AND array_length(services, 1) BETWEEN 1 AND 10
  AND (source IS NULL OR char_length(source) <= 100)
  -- Téléphone : obligatoire partout, sauf pour 'devis_borne' (téléphone OU e-mail,
  -- vérifié dans son cas ci-dessous). `IS DISTINCT FROM` et non `<>` : la source
  -- du formulaire de contact peut être NULL.
  AND (source IS NOT DISTINCT FROM 'devis_borne' OR char_length(phone) BETWEEN 6 AND 30)
  -- Photos : 3 au maximum, 5 pour 'devis_borne'.
  AND (
    photo_urls IS NULL
    OR array_length(photo_urls, 1) <= 3
    OR (source IS NOT DISTINCT FROM 'devis_borne' AND array_length(photo_urls, 1) <= 5)
  )
  AND (
    CASE
      WHEN source = 'simulateur' THEN
        -- GSM belge obligatoire, avec ou sans préfixe pays.
        phone ~ '^(\+32|0032|0)?4[5-9][0-9]{7}$'
        -- Email OBLIGATOIRE et syntaxiquement valide : c'est lui qui porte
        -- l'estimation détaillée envoyée au client.
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
      WHEN source = 'devis_borne' THEN
        -- Téléphone OU e-mail : au moins un des deux, chacun valide s'il est donné.
        -- Le téléphone absent est une chaîne vide (la colonne n'accepte pas NULL).
        (phone = '' OR char_length(phone) BETWEEN 6 AND 30)
        AND (
          email IS NULL
          OR (
            char_length(email) BETWEEN 6 AND 255
            AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
          )
        )
        AND (char_length(phone) BETWEEN 6 AND 30 OR email IS NOT NULL)
        -- Code postal belge obligatoire.
        AND code_postal IS NOT NULL AND code_postal ~ '^[0-9]{4}$'
        -- Ce formulaire ne sert qu'aux bornes : le service est imposé, pour que
        -- la demande soit toujours comptée dans « Demandes de bornes ».
        AND services = ARRAY['Borne de recharge voiture électrique']::text[]
        -- Tout le reste est facultatif, avec des tailles bornées.
        AND (message IS NULL OR char_length(message) <= 5000)
        AND (address IS NULL OR char_length(address) <= 300)
        AND (timing IS NULL OR char_length(timing) <= 100)
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

-- ----------------------------------------------------------------------------
-- 3. Stockage des photos : images seulement, 8 Mo au maximum par fichier
-- ----------------------------------------------------------------------------
UPDATE storage.buckets
   SET file_size_limit = 8388608,
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
 WHERE id = 'lead-photos';

COMMIT;

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
