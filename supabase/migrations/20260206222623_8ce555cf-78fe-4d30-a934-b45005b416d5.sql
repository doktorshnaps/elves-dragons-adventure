
-- Create missing add_ell_balance function that pvp-submit-move edge function calls
CREATE OR REPLACE FUNCTION public.add_ell_balance(
  p_wallet_address text,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.game_data
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE wallet_address = p_wallet_address;
END;
$$;
