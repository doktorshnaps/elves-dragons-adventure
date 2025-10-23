-- Create admin function to give items to players
CREATE OR REPLACE FUNCTION public.admin_give_items_to_player(
  p_admin_wallet_address text,
  p_target_wallet_address text,
  p_items jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_inventory jsonb;
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' AND NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can give items to players';
  END IF;

  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE wallet_address = p_target_wallet_address) THEN
    RAISE EXCEPTION 'Player not found: %', p_target_wallet_address;
  END IF;

  -- Get current inventory
  SELECT COALESCE(inventory, '[]'::jsonb) INTO v_current_inventory
  FROM public.game_data
  WHERE wallet_address = p_target_wallet_address;

  -- Add new items to inventory
  UPDATE public.game_data
  SET 
    inventory = v_current_inventory || p_items,
    updated_at = now()
  WHERE wallet_address = p_target_wallet_address;

  RAISE LOG 'Admin % gave % items to player %', p_admin_wallet_address, jsonb_array_length(p_items), p_target_wallet_address;

  RETURN TRUE;
END;
$$;