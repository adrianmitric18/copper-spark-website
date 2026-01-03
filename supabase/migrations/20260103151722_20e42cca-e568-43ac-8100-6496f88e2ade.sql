-- Create table to store contact requests
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  project_type TEXT,
  message TEXT,
  wants_callback BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from edge functions (service role only)
-- No public read access for security
CREATE POLICY "Service role can manage contact_requests" 
ON public.contact_requests 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create rate limiting table to track submissions per IP
CREATE TABLE public.contact_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy for service role only
CREATE POLICY "Service role can manage rate_limits" 
ON public.contact_rate_limits 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create index for faster rate limit lookups
CREATE INDEX idx_rate_limits_ip_time ON public.contact_rate_limits (ip_address, submitted_at DESC);

-- Function to clean old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.contact_rate_limits WHERE submitted_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;