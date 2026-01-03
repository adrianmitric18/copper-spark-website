-- Fix RLS policies for contact_requests table
-- Remove old policy if exists and create proper restrictive policies
DROP POLICY IF EXISTS "Service role can manage contact_requests" ON public.contact_requests;

-- Only service role can SELECT contact requests (not public)
CREATE POLICY "Service role can select contact_requests" 
ON public.contact_requests 
FOR SELECT 
TO service_role
USING (true);

-- Only service role can INSERT contact requests
CREATE POLICY "Service role can insert contact_requests" 
ON public.contact_requests 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Only service role can UPDATE contact requests
CREATE POLICY "Service role can update contact_requests" 
ON public.contact_requests 
FOR UPDATE 
TO service_role
USING (true);

-- Only service role can DELETE contact requests
CREATE POLICY "Service role can delete contact_requests" 
ON public.contact_requests 
FOR DELETE 
TO service_role
USING (true);

-- Fix RLS policies for contact_rate_limits table
DROP POLICY IF EXISTS "Service role can manage rate_limits" ON public.contact_rate_limits;

-- Only service role can SELECT rate limits
CREATE POLICY "Service role can select rate_limits" 
ON public.contact_rate_limits 
FOR SELECT 
TO service_role
USING (true);

-- Only service role can INSERT rate limits
CREATE POLICY "Service role can insert rate_limits" 
ON public.contact_rate_limits 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Only service role can DELETE rate limits
CREATE POLICY "Service role can delete rate_limits" 
ON public.contact_rate_limits 
FOR DELETE 
TO service_role
USING (true);