-- Create function to synchronize card instances with game_data cards
CREATE OR REPLACE FUNCTION public.sync_card_instances_from_game_data(p_wallet_address text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_game_data RECORD;
  v_card RECORD;
  v_card_json jsonb;
  v_synced_count integer := 0;
  v_card_type text;
  v_health integer;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Get game data for the wallet
  SELECT * INTO v_game_data 
  FROM public.game_data 
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_game_data IS NULL THEN
    RAISE EXCEPTION 'Game data not found for wallet: %', p_wallet_address;
  END IF;

  -- Loop through each card in game_data.cards
  FOR v_card_json IN SELECT * FROM jsonb_array_elements(COALESCE(v_game_data.cards, '[]'::jsonb))
  LOOP
    -- Extract card information
    v_card_type := CASE 
      WHEN v_card_json->>'type' = 'pet' THEN 'dragon' 
      ELSE 'hero' 
    END;
    v_health := COALESCE((v_card_json->>'health')::integer, (v_card_json->>'currentHealth')::integer, 0);

    -- Check if card instance already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.card_instances 
      WHERE wallet_address = p_wallet_address 
        AND card_template_id = v_card_json->>'id'
    ) THEN
      -- Create new card instance
      INSERT INTO public.card_instances (
        wallet_address,
        user_id,
        card_template_id,
        card_type,
        current_health,
        max_health,
        last_heal_time,
        card_data
      ) VALUES (
        p_wallet_address,
        v_game_data.user_id,
        v_card_json->>'id',
        v_card_type,
        COALESCE((v_card_json->>'currentHealth')::integer, v_health),
        v_health,
        COALESCE(
          to_timestamp((v_card_json->>'lastHealTime')::bigint / 1000.0),
          now()
        ),
        v_card_json
      );
      
      v_synced_count := v_synced_count + 1;
    END IF;
  END LOOP;

  RETURN v_synced_count;
END;
$$;