-- Drop all existing policies on contact_rate_limits
DROP POLICY IF EXISTS "Service role can delete rate_limits" ON public.contact_rate_limits;
DROP POLICY IF EXISTS "Service role can insert rate_limits" ON public.contact_rate_limits;
DROP POLICY IF EXISTS "Service role can select rate_limits" ON public.contact_rate_limits;
DROP POLICY IF EXISTS "Service role can update rate_limits" ON public.contact_rate_limits;

-- Drop all existing policies on contact_requests
DROP POLICY IF EXISTS "Service role can delete contact_requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Service role can insert contact_requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Service role can select contact_requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Service role can update contact_requests" ON public.contact_requests;

-- RLS is already enabled on both tables
-- With no permissive policies, only service_role can access (bypasses RLS)
-- This secures sensitive data (IP addresses, emails, phone numbers) from public access

-- Verify RLS is enabled (no-op if already enabled)
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;