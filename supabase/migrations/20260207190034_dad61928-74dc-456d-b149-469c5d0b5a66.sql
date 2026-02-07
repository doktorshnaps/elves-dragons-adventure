
-- 1. Create public view for profiles (hide sensitive fields)
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT wallet_address, display_name
  FROM public.profiles;

-- 2. Restrict base profiles table SELECT
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_no_direct_select"
  ON public.profiles FOR SELECT
  USING (false);

-- 3. Fix pvp_queue: drop the permissive policy
DROP POLICY IF EXISTS "Users can view their own queue entries" ON public.pvp_queue;

-- 4. Create RPC for checking own queue entry
CREATE OR REPLACE FUNCTION public.get_my_queue_entry(p_wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT to_jsonb(q.*) INTO v_result
  FROM pvp_queue q
  WHERE q.wallet_address = p_wallet
    AND q.status = 'searching'
    AND q.expires_at > now()
  LIMIT 1;
  
  RETURN v_result;
END;
$$;

-- 5. Fix pvp_bot_teams mutation policies
DROP POLICY IF EXISTS "Users can insert their own bot teams" ON public.pvp_bot_teams;
DROP POLICY IF EXISTS "Users can update their own bot teams" ON public.pvp_bot_teams;
DROP POLICY IF EXISTS "Users can delete their own bot teams" ON public.pvp_bot_teams;

CREATE POLICY "Service role can insert bot teams"
  ON public.pvp_bot_teams FOR INSERT
  WITH CHECK (current_setting('role', true) = 'service_role');

CREATE POLICY "Service role can update bot teams"
  ON public.pvp_bot_teams FOR UPDATE
  USING (current_setting('role', true) = 'service_role');

CREATE POLICY "Service role can delete bot teams"
  ON public.pvp_bot_teams FOR DELETE
  USING (current_setting('role', true) = 'service_role');

-- 6. Fix search_path on get_current_user_wallet
CREATE OR REPLACE FUNCTION public.get_current_user_wallet()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_address text;
BEGIN
  SELECT wallet_address INTO v_wallet_address
  FROM public.game_data
  WHERE user_id = auth.uid()
  LIMIT 1;
  RETURN v_wallet_address;
END;
$$;
