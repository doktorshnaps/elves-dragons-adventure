-- Create atomic inventory update function
CREATE OR REPLACE FUNCTION public.atomic_inventory_update(
  p_wallet_address text,
  p_price_deduction integer,
  p_new_item jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Atomically update balance and add item to inventory
  UPDATE public.game_data 
  SET 
    balance = balance - p_price_deduction,
    inventory = coalesce(inventory, '[]'::jsonb) || jsonb_build_array(p_new_item),
    updated_at = now()
  WHERE wallet_address = p_wallet_address
  RETURNING jsonb_build_object(
    'balance', balance,
    'inventory', inventory
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Wallet not found or insufficient balance';
  END IF;
  
  RETURN v_result;
END;
$$;