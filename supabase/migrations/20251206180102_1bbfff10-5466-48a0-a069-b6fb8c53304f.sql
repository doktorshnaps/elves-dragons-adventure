-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.api_rate_limits;

-- Create restrictive policy - only service_role can access
CREATE POLICY "Service role only access"
ON public.api_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure no public access - deny all for anon and authenticated
CREATE POLICY "Deny public access"
ON public.api_rate_limits
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);