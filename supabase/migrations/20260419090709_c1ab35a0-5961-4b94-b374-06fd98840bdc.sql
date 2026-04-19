-- Drop old restrictive SELECT policies
DROP POLICY IF EXISTS "Deny anon select on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Deny authenticated select on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Deny anon update on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Deny authenticated update on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Deny anon delete on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Deny authenticated delete on testimonials" ON public.testimonials;

-- Public can read approved reviews
CREATE POLICY "Public can read approved testimonials"
ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (approved = true OR public.is_admin());

-- Admin full management
CREATE POLICY "Admin can insert testimonials"
ON public.testimonials
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update testimonials"
ON public.testimonials
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete testimonials"
ON public.testimonials
FOR DELETE
TO authenticated
USING (public.is_admin());