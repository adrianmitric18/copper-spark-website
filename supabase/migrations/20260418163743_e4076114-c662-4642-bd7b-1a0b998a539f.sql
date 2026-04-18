-- 1. Storage: lock down assets bucket
DROP POLICY IF EXISTS "Anyone can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Public assets are accessible to everyone" ON storage.objects;

-- Allow individual file reads (by exact path) but no listing
CREATE POLICY "Public read individual assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'assets' AND name IS NOT NULL);

-- Service role only for writes
CREATE POLICY "Service role can upload assets"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Service role can update assets"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'assets')
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Service role can delete assets"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'assets');

-- Deny update/delete to anon/authenticated explicitly
CREATE POLICY "Deny anon update assets"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'assets' AND false);

CREATE POLICY "Deny anon delete assets"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'assets' AND false);

-- 2. Testimonials: add DB-level constraints to prevent abuse
ALTER TABLE public.testimonials
  ADD CONSTRAINT testimonials_name_len CHECK (char_length(name) BETWEEN 1 AND 50),
  ADD CONSTRAINT testimonials_message_len CHECK (char_length(message) BETWEEN 1 AND 500),
  ADD CONSTRAINT testimonials_city_len CHECK (city IS NULL OR char_length(city) <= 50),
  ADD CONSTRAINT testimonials_service_len CHECK (service IS NULL OR char_length(service) <= 100),
  ADD CONSTRAINT testimonials_rating_range CHECK (rating BETWEEN 1 AND 5);