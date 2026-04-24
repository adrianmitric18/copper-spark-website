ALTER TABLE public.leads
ALTER COLUMN source SET DEFAULT 'formulaire_site';

UPDATE public.leads
SET source = 'formulaire_site'
WHERE source IS NULL;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS notes_internes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_source_allowed'
  ) THEN
    ALTER TABLE public.leads
    ADD CONSTRAINT leads_source_allowed
    CHECK (
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
        'Autre'
      )
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "Admin can insert leads" ON public.leads;
CREATE POLICY "Admin can insert leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
  AND char_length(name) >= 1 AND char_length(name) <= 100
  AND char_length(email) >= 3 AND char_length(email) <= 255
  AND char_length(phone) >= 6 AND char_length(phone) <= 30
  AND char_length(address) >= 3 AND char_length(address) <= 300
  AND rue IS NOT NULL AND char_length(rue) >= 1 AND char_length(rue) <= 150
  AND numero IS NOT NULL AND char_length(numero) >= 1 AND char_length(numero) <= 20
  AND code_postal IS NOT NULL AND char_length(code_postal) = 4 AND code_postal ~ '^[0-9]{4}$'
  AND commune IS NOT NULL AND char_length(commune) >= 1 AND char_length(commune) <= 100
  AND char_length(client_type) >= 1 AND char_length(client_type) <= 50
  AND array_length(services, 1) >= 1 AND array_length(services, 1) <= 10
  AND char_length(message) >= 1 AND char_length(message) <= 5000
  AND (timing IS NULL OR char_length(timing) <= 100)
  AND (source IS NULL OR source IN ('formulaire_site', 'telephone', 'whatsapp', 'facebook', 'recommandation', 'chantier', 'autre'))
  AND (notes_internes IS NULL OR char_length(notes_internes) <= 2000)
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) <= 3)
  AND gdpr_consent = true
  AND status = 'nouveau'
);