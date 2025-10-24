-- Fix admin_give_items_to_player to insert into item_instances table
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
  v_item jsonb;
  v_template record;
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' AND NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can give items to players';
  END IF;

  -- Check if target user exists in game_data
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE wallet_address = p_target_wallet_address) THEN
    RAISE EXCEPTION 'Player not found: %', p_target_wallet_address;
  END IF;

  -- Get current inventory from game_data (legacy support)
  SELECT COALESCE(inventory, '[]'::jsonb) INTO v_current_inventory
  FROM public.game_data
  WHERE wallet_address = p_target_wallet_address;

  -- Update legacy JSON inventory in game_data
  UPDATE public.game_data
  SET 
    inventory = v_current_inventory || p_items,
    updated_at = now()
  WHERE wallet_address = p_target_wallet_address;

  -- Insert items into item_instances table (modern approach)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Try to find matching template by name
    SELECT * INTO v_template
    FROM public.item_templates
    WHERE name = (v_item->>'name')
    LIMIT 1;

    -- Insert into item_instances
    INSERT INTO public.item_instances (
      wallet_address,
      template_id,
      item_id,
      name,
      type
    ) VALUES (
      p_target_wallet_address,
      v_template.id,
      v_template.item_id,
      v_item->>'name',
      COALESCE(v_item->>'type', v_template.type, 'material')
    );
  END LOOP;

  RAISE LOG 'Admin % gave % items to player % (added to item_instances)', 
    p_admin_wallet_address, jsonb_array_length(p_items), p_target_wallet_address;

  RETURN TRUE;
END;
$$;