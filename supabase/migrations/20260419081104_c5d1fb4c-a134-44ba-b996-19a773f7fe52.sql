-- Drop old contact system
DROP TABLE IF EXISTS public.contact_requests CASCADE;
DROP TABLE IF EXISTS public.contact_rate_limits CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits() CASCADE;

-- Create leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  client_type text NOT NULL,
  services text[] NOT NULL,
  message text NOT NULL,
  timing text,
  source text,
  photo_urls text[],
  status text NOT NULL DEFAULT 'nouveau',
  notes text,
  gdpr_consent boolean NOT NULL
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert with strict validation
CREATE POLICY "Anyone can submit a valid lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(phone) BETWEEN 6 AND 30
  AND char_length(address) BETWEEN 3 AND 300
  AND char_length(client_type) BETWEEN 1 AND 50
  AND array_length(services, 1) BETWEEN 1 AND 10
  AND char_length(message) BETWEEN 10 AND 5000
  AND (timing IS NULL OR char_length(timing) <= 100)
  AND (source IS NULL OR char_length(source) <= 100)
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) <= 3)
  AND gdpr_consent = true
  AND status = 'nouveau'
);

-- Deny all reads/updates/deletes for anon and authenticated (service_role bypasses RLS)
CREATE POLICY "Deny anon select on leads" ON public.leads FOR SELECT TO anon USING (false);
CREATE POLICY "Deny authenticated select on leads" ON public.leads FOR SELECT TO authenticated USING (false);
CREATE POLICY "Deny anon update on leads" ON public.leads FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny authenticated update on leads" ON public.leads FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Deny anon delete on leads" ON public.leads FOR DELETE TO anon USING (false);
CREATE POLICY "Deny authenticated delete on leads" ON public.leads FOR DELETE TO authenticated USING (false);

CREATE INDEX idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX idx_leads_status ON public.leads (status);

-- Storage bucket for lead photos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-photos', 'lead-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous uploads to lead-photos bucket
CREATE POLICY "Anyone can upload lead photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'lead-photos');

-- Deny reads/updates/deletes for anon and authenticated on lead-photos
CREATE POLICY "Deny anon read lead photos"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id <> 'lead-photos');

CREATE POLICY "Deny authenticated read lead photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id <> 'lead-photos');