-- Add admin SELECT policy for mgt_claims
CREATE POLICY "Admins can view all mgt claims"
ON public.mgt_claims
FOR SELECT
USING (public.is_admin_or_super_wallet(public.get_current_user_wallet()));

-- Create admin RPC to fetch player mgt_claims 
CREATE OR REPLACE FUNCTION public.admin_get_player_mgt_claims(
  p_admin_wallet_address TEXT,
  p_player_wallet_address TEXT
)
RETURNS TABLE (
  id uuid,
  wallet_address text,
  amount numeric,
  claim_type text,
  source_item_id text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.wallet_address,
    c.amount,
    c.claim_type,
    c.source_item_id,
    c.created_at
  FROM public.mgt_claims c
  WHERE c.wallet_address = p_player_wallet_address
  ORDER BY c.created_at DESC;
END;
$$;

-- Create admin RPC to fetch player mGT balance
CREATE OR REPLACE FUNCTION public.admin_get_player_mgt_balance(
  p_admin_wallet_address TEXT,
  p_player_wallet_address TEXT
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT COALESCE(mgt_balance, 0) INTO v_balance
  FROM public.game_data
  WHERE wallet_address = p_player_wallet_address;

  RETURN COALESCE(v_balance, 0);
END;
$$;