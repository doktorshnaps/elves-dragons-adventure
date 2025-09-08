-- Create admin_find_user_by_wallet to bypass RLS for admins
CREATE OR REPLACE FUNCTION public.admin_find_user_by_wallet(
  p_wallet_address text,
  p_admin_wallet_address text
) RETURNS TABLE (
  user_id uuid,
  wallet_address text,
  balance integer,
  account_level integer,
  created_at timestamptz
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple admin check by wallet address (aligns with existing admin policies)
  IF p_admin_wallet_address <> 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT g.user_id, g.wallet_address, g.balance, g.account_level, g.created_at
  FROM public.game_data g
  WHERE g.wallet_address = p_wallet_address
  LIMIT 1;
END;
$$;

-- Allow web clients to call the function
GRANT EXECUTE ON FUNCTION public.admin_find_user_by_wallet(text, text) TO anon, authenticated;