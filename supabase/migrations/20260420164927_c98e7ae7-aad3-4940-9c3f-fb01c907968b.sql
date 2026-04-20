-- Add new structured address columns
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS rue text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS code_postal text,
  ADD COLUMN IF NOT EXISTS commune text;

-- Migrate existing data: copy old address into rue for legacy leads
UPDATE public.leads
SET rue = address
WHERE rue IS NULL AND address IS NOT NULL;

-- Update the public insert RLS policy to require the new structured fields
DROP POLICY IF EXISTS "Anyone can submit a valid lead" ON public.leads;

CREATE POLICY "Anyone can submit a valid lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(phone) BETWEEN 6 AND 30
  AND char_length(address) BETWEEN 3 AND 300
  AND rue IS NOT NULL AND char_length(rue) BETWEEN 1 AND 150
  AND numero IS NOT NULL AND char_length(numero) BETWEEN 1 AND 20
  AND code_postal IS NOT NULL AND char_length(code_postal) BETWEEN 4 AND 4 AND code_postal ~ '^[0-9]{4}$'
  AND commune IS NOT NULL AND char_length(commune) BETWEEN 1 AND 100
  AND char_length(client_type) BETWEEN 1 AND 50
  AND array_length(services, 1) BETWEEN 1 AND 10
  AND char_length(message) BETWEEN 10 AND 5000
  AND (timing IS NULL OR char_length(timing) <= 100)
  AND (source IS NULL OR char_length(source) <= 100)
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) <= 3)
  AND gdpr_consent = true
  AND status = 'nouveau'
);