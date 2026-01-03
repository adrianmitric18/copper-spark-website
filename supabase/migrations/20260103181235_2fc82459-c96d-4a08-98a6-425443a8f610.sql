-- Add explicit RLS policies that DENY all access for anon/authenticated roles
-- Only service_role (used by Edge Functions) can access these tables (bypasses RLS)

-- Policies for contact_rate_limits
-- Block all anonymous access explicitly
CREATE POLICY "Deny anon select on rate_limits" 
ON public.contact_rate_limits 
FOR SELECT 
TO anon 
USING (false);

CREATE POLICY "Deny anon insert on rate_limits" 
ON public.contact_rate_limits 
FOR INSERT 
TO anon 
WITH CHECK (false);

CREATE POLICY "Deny anon update on rate_limits" 
ON public.contact_rate_limits 
FOR UPDATE 
TO anon 
USING (false);

CREATE POLICY "Deny anon delete on rate_limits" 
ON public.contact_rate_limits 
FOR DELETE 
TO anon 
USING (false);

-- Block all authenticated access explicitly
CREATE POLICY "Deny authenticated select on rate_limits" 
ON public.contact_rate_limits 
FOR SELECT 
TO authenticated 
USING (false);

CREATE POLICY "Deny authenticated insert on rate_limits" 
ON public.contact_rate_limits 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "Deny authenticated update on rate_limits" 
ON public.contact_rate_limits 
FOR UPDATE 
TO authenticated 
USING (false);

CREATE POLICY "Deny authenticated delete on rate_limits" 
ON public.contact_rate_limits 
FOR DELETE 
TO authenticated 
USING (false);

-- Policies for contact_requests
-- Block all anonymous access explicitly
CREATE POLICY "Deny anon select on contact_requests" 
ON public.contact_requests 
FOR SELECT 
TO anon 
USING (false);

CREATE POLICY "Deny anon insert on contact_requests" 
ON public.contact_requests 
FOR INSERT 
TO anon 
WITH CHECK (false);

CREATE POLICY "Deny anon update on contact_requests" 
ON public.contact_requests 
FOR UPDATE 
TO anon 
USING (false);

CREATE POLICY "Deny anon delete on contact_requests" 
ON public.contact_requests 
FOR DELETE 
TO anon 
USING (false);

-- Block all authenticated access explicitly
CREATE POLICY "Deny authenticated select on contact_requests" 
ON public.contact_requests 
FOR SELECT 
TO authenticated 
USING (false);

CREATE POLICY "Deny authenticated insert on contact_requests" 
ON public.contact_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "Deny authenticated update on contact_requests" 
ON public.contact_requests 
FOR UPDATE 
TO authenticated 
USING (false);

CREATE POLICY "Deny authenticated delete on contact_requests" 
ON public.contact_requests 
FOR DELETE 
TO authenticated 
USING (false);