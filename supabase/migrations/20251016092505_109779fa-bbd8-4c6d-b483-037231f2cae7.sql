-- Исправляем функцию atomic_inventory_update - добавляем SET search_path
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
  v_current_balance integer;
BEGIN
  -- Get current balance first
  SELECT balance INTO v_current_balance
  FROM public.game_data 
  WHERE wallet_address = p_wallet_address;
  
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Check if user has enough balance
  IF v_current_balance < p_price_deduction THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', v_current_balance, p_price_deduction;
  END IF;
  
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
  
  RETURN v_result;
END;
$$;

-- Исправляем триггерную функцию update_item_templates_updated_at - добавляем SET search_path
CREATE OR REPLACE FUNCTION public.update_item_templates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;