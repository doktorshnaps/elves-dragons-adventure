
-- Fix admin_add_balance_by_id to accept admin wallet as parameter
CREATE OR REPLACE FUNCTION public.admin_add_balance_by_id(
  p_target_user_id text,
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
    RAISE EXCEPTION 'Unauthorized: Only admin can add balance';
  END IF;

  UPDATE public.game_data
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  RETURN FOUND;
END;
$$;
