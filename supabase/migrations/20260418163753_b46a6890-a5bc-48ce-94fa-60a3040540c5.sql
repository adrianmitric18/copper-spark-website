DROP POLICY IF EXISTS "Anyone can submit a testimonial" ON public.testimonials;

CREATE POLICY "Anyone can submit a valid testimonial"
ON public.testimonials
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 50
  AND char_length(message) BETWEEN 1 AND 500
  AND rating BETWEEN 1 AND 5
  AND (city IS NULL OR char_length(city) <= 50)
  AND (service IS NULL OR char_length(service) <= 100)
  AND approved = false
);