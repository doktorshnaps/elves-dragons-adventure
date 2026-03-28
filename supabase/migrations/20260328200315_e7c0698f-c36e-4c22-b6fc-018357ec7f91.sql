-- Fix: Replace spoofable current_setting('role') with auth.role() on claim_nonces and claim_rate_limits

-- claim_nonces: drop and recreate
DROP POLICY IF EXISTS "Service role full access on claim_nonces" ON public.claim_nonces;
CREATE POLICY "Service role full access on claim_nonces"
  ON public.claim_nonces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- claim_rate_limits: drop and recreate
DROP POLICY IF EXISTS "Service role full access on claim_rate_limits" ON public.claim_rate_limits;
CREATE POLICY "Service role full access on claim_rate_limits"
  ON public.claim_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
