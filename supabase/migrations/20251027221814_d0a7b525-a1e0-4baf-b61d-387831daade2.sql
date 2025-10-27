-- Update open_card_packs to also remove packs from item_instances
CREATE OR REPLACE FUNCTION public.open_card_packs(
  p_wallet_address text,
  p_pack_name text,
  p_count integer,
  p_new_cards jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_inventory jsonb;
  v_current_cards jsonb;
  v_updated_inventory jsonb;
  v_packs_found integer := 0;
  v_item jsonb;
  v_instance_ids_to_remove uuid[] := '{}';
  v_instance record;
BEGIN
  -- Validate parameters
  IF p_wallet_address IS NULL OR p_pack_name IS NULL OR p_count < 1 THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  -- Get current inventory and cards with row lock
  SELECT inventory, cards INTO v_current_inventory, v_current_cards
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game data not found for wallet: %', p_wallet_address;
  END IF;

  -- Initialize if null
  v_current_inventory := COALESCE(v_current_inventory, '[]'::jsonb);
  v_current_cards := COALESCE(v_current_cards, '[]'::jsonb);

  -- Count and remove card packs from JSON inventory
  v_updated_inventory := '[]'::jsonb;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_current_inventory)
  LOOP
    -- Check if this is a card pack with matching name
    IF (v_item->>'type' = 'cardPack' AND v_item->>'name' = p_pack_name) THEN
      IF v_packs_found < p_count THEN
        v_packs_found := v_packs_found + 1;
        -- Skip this item (don't add to updated inventory)
        CONTINUE;
      END IF;
    END IF;
    
    -- Keep all other items
    v_updated_inventory := v_updated_inventory || jsonb_build_array(v_item);
  END LOOP;

  -- Also collect card pack instances from item_instances to remove
  FOR v_instance IN 
    SELECT id 
    FROM public.item_instances
    WHERE wallet_address = p_wallet_address 
      AND type = 'cardPack'
      AND (name = p_pack_name OR name IS NULL)
    ORDER BY created_at ASC
    LIMIT p_count
  LOOP
    v_instance_ids_to_remove := array_append(v_instance_ids_to_remove, v_instance.id);
  END LOOP;

  -- Remove card packs from item_instances
  IF array_length(v_instance_ids_to_remove, 1) > 0 THEN
    DELETE FROM public.item_instances
    WHERE id = ANY(v_instance_ids_to_remove);
    
    RAISE LOG 'Removed % card pack instances from item_instances', array_length(v_instance_ids_to_remove, 1);
  END IF;

  -- Verify we found enough packs (from JSON inventory or item_instances)
  IF v_packs_found < p_count AND array_length(v_instance_ids_to_remove, 1) < p_count THEN
    RAISE EXCEPTION 'Insufficient card packs. Found in JSON: %, Found in instances: %, Required: %', 
      v_packs_found, COALESCE(array_length(v_instance_ids_to_remove, 1), 0), p_count;
  END IF;

  -- Add new cards to cards array
  v_current_cards := v_current_cards || p_new_cards;

  -- Update game data
  UPDATE public.game_data
  SET 
    inventory = v_updated_inventory,
    cards = v_current_cards,
    updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'packs_opened_json', v_packs_found,
    'packs_opened_instances', COALESCE(array_length(v_instance_ids_to_remove, 1), 0),
    'cards_received', jsonb_array_length(p_new_cards)
  );
END;
$$;