-- Fix sync_card_instances_from_game_data to correctly extract max health
-- The issue: max_health was being set incorrectly, using currentHealth instead of health
DROP FUNCTION IF EXISTS public.sync_card_instances_from_game_data(text);

CREATE OR REPLACE FUNCTION public.sync_card_instances_from_game_data(p_wallet_address text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_game_data RECORD;
  v_card_json jsonb;
  v_synced_count integer := 0;
  v_card_type text;
  v_max_health integer;
  v_current_health integer;
BEGIN
  RAISE LOG 'SYNC_DEBUG: sync_card_instances_from_game_data called for wallet=%', p_wallet_address;
  
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  SELECT * INTO v_game_data 
  FROM public.game_data 
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_game_data IS NULL THEN
    RAISE EXCEPTION 'Game data not found for wallet: %', p_wallet_address;
  END IF;

  FOR v_card_json IN SELECT * FROM jsonb_array_elements(COALESCE(v_game_data.cards, '[]'::jsonb))
  LOOP
    v_card_type := CASE 
      WHEN v_card_json->>'type' = 'pet' THEN 'dragon'
      WHEN v_card_json->>'type' = 'worker' OR v_card_json->>'type' = 'workers' THEN 'workers'
      ELSE 'hero' 
    END;
    
    -- CRITICAL FIX: Always use 'health' field for max_health, never currentHealth
    -- 'health' is the maximum health, 'currentHealth' is the current value
    v_max_health := COALESCE((v_card_json->>'health')::integer, 100);
    v_current_health := COALESCE((v_card_json->>'currentHealth')::integer, v_max_health);

    -- Make sure current health doesn't exceed max health
    v_current_health := LEAST(v_current_health, v_max_health);

    IF NOT EXISTS (
      SELECT 1 FROM public.card_instances 
      WHERE wallet_address = p_wallet_address 
        AND card_template_id = v_card_json->>'id'
    ) THEN
      RAISE LOG 'SYNC_DEBUG: Creating card_instance wallet=% card_id=% max_health=% current_health=%', 
        p_wallet_address, v_card_json->>'id', v_max_health, v_current_health;
        
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
        v_current_health,
        v_max_health,
        COALESCE(
          to_timestamp((v_card_json->>'lastHealTime')::bigint / 1000.0),
          now()
        ),
        v_card_json
      );
      
      v_synced_count := v_synced_count + 1;
    ELSE
      -- Card instance exists, update max_health if it's wrong
      UPDATE public.card_instances
      SET 
        max_health = v_max_health,
        current_health = LEAST(current_health, v_max_health),
        updated_at = now()
      WHERE wallet_address = p_wallet_address 
        AND card_template_id = v_card_json->>'id'
        AND (max_health != v_max_health OR current_health > v_max_health);
    END IF;
  END LOOP;

  RAISE LOG 'SYNC_DEBUG: Synced/updated % card instances for wallet=%', v_synced_count, p_wallet_address;
  RETURN v_synced_count;
END;
$function$;