
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  service TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  message TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a testimonial
CREATE POLICY "Anyone can submit a testimonial"
ON public.testimonials
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Block direct reads (admin reads via service_role)
CREATE POLICY "Deny anon select on testimonials"
ON public.testimonials
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny authenticated select on testimonials"
ON public.testimonials
FOR SELECT
TO authenticated
USING (false);

-- Block updates/deletes
CREATE POLICY "Deny anon update on testimonials"
ON public.testimonials
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny authenticated update on testimonials"
ON public.testimonials
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny anon delete on testimonials"
ON public.testimonials
FOR DELETE
TO anon
USING (false);

CREATE POLICY "Deny authenticated delete on testimonials"
ON public.testimonials
FOR DELETE
TO authenticated
USING (false);
