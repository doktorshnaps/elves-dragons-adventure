-- Create table for API rate limiting
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup 
  ON public.api_rate_limits(ip_address, endpoint, created_at DESC);

-- Enable RLS (not critical for rate limiting but good practice)
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage rate limits
CREATE POLICY "Service role can manage rate limits"
  ON public.api_rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Cleanup function to remove old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_rate_limits 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;