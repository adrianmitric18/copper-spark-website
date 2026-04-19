-- Helper function to check if current user is the admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = 'cuivre.electrique@gmail.com',
    false
  );
$$;

-- Drop existing deny policies for admin operations on leads
DROP POLICY IF EXISTS "Deny anon select on leads" ON public.leads;
DROP POLICY IF EXISTS "Deny authenticated select on leads" ON public.leads;
DROP POLICY IF EXISTS "Deny anon update on leads" ON public.leads;
DROP POLICY IF EXISTS "Deny authenticated update on leads" ON public.leads;
DROP POLICY IF EXISTS "Deny anon delete on leads" ON public.leads;
DROP POLICY IF EXISTS "Deny authenticated delete on leads" ON public.leads;

-- Re-deny anon access explicitly
CREATE POLICY "Deny anon select on leads"
ON public.leads FOR SELECT TO anon USING (false);

CREATE POLICY "Deny anon update on leads"
ON public.leads FOR UPDATE TO anon USING (false);

CREATE POLICY "Deny anon delete on leads"
ON public.leads FOR DELETE TO anon USING (false);

-- Allow admin to read all leads
CREATE POLICY "Admin can select leads"
ON public.leads FOR SELECT TO authenticated
USING (public.is_admin());

-- Allow admin to update leads (status, notes)
CREATE POLICY "Admin can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow admin to delete leads
CREATE POLICY "Admin can delete leads"
ON public.leads FOR DELETE TO authenticated
USING (public.is_admin());

-- Block other authenticated users
CREATE POLICY "Deny non-admin select on leads"
ON public.leads FOR SELECT TO authenticated
USING (public.is_admin());

-- Storage policy: admin can read photos in lead-photos bucket
CREATE POLICY "Admin can read lead photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lead-photos' AND public.is_admin());