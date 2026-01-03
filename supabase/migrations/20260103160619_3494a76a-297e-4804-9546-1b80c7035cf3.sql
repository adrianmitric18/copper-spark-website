-- Add UPDATE policy for contact_rate_limits table
CREATE POLICY "Service role can update rate_limits" 
ON public.contact_rate_limits 
FOR UPDATE 
TO service_role
USING (true);