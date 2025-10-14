-- Create RPC function for opening card packs atomically
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

  -- Count and remove card packs from inventory
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

  -- Verify we found enough packs
  IF v_packs_found < p_count THEN
    RAISE EXCEPTION 'Insufficient card packs. Found: %, Required: %', v_packs_found, p_count;
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
    'packs_opened', v_packs_found,
    'cards_received', jsonb_array_length(p_new_cards)
  );
END;
$$;