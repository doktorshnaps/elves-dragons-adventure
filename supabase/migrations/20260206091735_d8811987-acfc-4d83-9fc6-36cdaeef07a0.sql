
-- Fix admin_add_balance to accept admin wallet as parameter instead of relying on auth.uid()
CREATE OR REPLACE FUNCTION public.admin_add_balance(
  p_target_wallet_address text,
  p_amount integer,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller wallet is admin (passed from client or use current_setting)
  IF p_admin_wallet_address IS NULL THEN
    p_admin_wallet_address := current_setting('request.headers', true)::json->>'x-wallet-address';
  END IF;
  
  -- Validate admin status
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can add balance';
  END IF;

  UPDATE public.game_data
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE wallet_address = p_target_wallet_address;

  RETURN FOUND;
END;
$$;

-- Also fix admin_add_mgt_balance function similarly
CREATE OR REPLACE FUNCTION public.admin_add_mgt_balance(
  p_target_wallet_address text,
  p_amount integer,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller wallet is admin
  IF p_admin_wallet_address IS NULL THEN
    p_admin_wallet_address := current_setting('request.headers', true)::json->>'x-wallet-address';
  END IF;
  
  -- Validate admin status
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can add MGT balance';
  END IF;

  UPDATE public.game_data
  SET mgt_balance = COALESCE(mgt_balance, 0) + p_amount,
      updated_at = now()
  WHERE wallet_address = p_target_wallet_address;

  RETURN FOUND;
END;
$$;
