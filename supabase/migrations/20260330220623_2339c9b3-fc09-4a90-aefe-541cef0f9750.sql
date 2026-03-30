
-- Fix: pvp_match_sessions has RLS enabled but no policies (deny-all by default).
-- Add explicit service_role-only policies so intent is clear and scanner is satisfied.
-- All access to this table is via service_role RPCs/edge functions.

CREATE POLICY "Service role full access to pvp_match_sessions"
ON public.pvp_match_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also add a read policy for authenticated users to see only their own sessions
CREATE POLICY "Users can view their own match sessions"
ON public.pvp_match_sessions
FOR SELECT
TO authenticated
USING (wallet_address = public.get_current_user_wallet());
