CREATE OR REPLACE FUNCTION public.is_clan_leader_or_deputy(p_wallet text, p_clan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clans c WHERE c.id = p_clan_id AND c.leader_wallet = p_wallet
  ) OR EXISTS (
    SELECT 1 FROM public.clan_members cm
    WHERE cm.clan_id = p_clan_id
      AND cm.wallet_address = p_wallet
      AND cm.role IN ('leader','deputy','co-leader','officer')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_clan_leader_or_deputy(text, uuid) TO anon, authenticated, service_role;