
-- Fix 1: client_error_logs — restrict insert to authenticated users
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.client_error_logs;
CREATE POLICY "Authenticated can insert error logs"
ON public.client_error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
REVOKE INSERT ON public.client_error_logs FROM anon;

-- Fix 2: pvp_bot_teams — remove public-role SELECT policy (authenticated-only policy already exists)
DROP POLICY IF EXISTS "Users can view all active bot teams" ON public.pvp_bot_teams;

-- Fix 3: game_data — make wallet_address immutable to prevent privilege escalation via wallet spoofing
CREATE OR REPLACE FUNCTION public.prevent_wallet_address_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_address IS DISTINCT FROM OLD.wallet_address THEN
    RAISE EXCEPTION 'wallet_address is immutable and cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS game_data_wallet_immutable ON public.game_data;
CREATE TRIGGER game_data_wallet_immutable
BEFORE UPDATE OF wallet_address ON public.game_data
FOR EACH ROW
EXECUTE FUNCTION public.prevent_wallet_address_change();
