-- Strengthen admin detection to avoid missing wallet mappings
CREATE OR REPLACE FUNCTION public.is_quest_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    COALESCE(
      (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
      (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1),
      ''
    ) = 'mr_bruts.tg'
  ) OR is_admin_wallet();
$$;