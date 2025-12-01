-- Fix sync_card_instances_from_game_data to use card_templates instead of game_data
DROP FUNCTION IF EXISTS public.sync_card_instances_from_game_data(text);

CREATE OR REPLACE FUNCTION public.sync_card_instances_from_game_data(p_wallet_address text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_game_data RECORD;
  v_card_json jsonb;
  v_synced_count integer := 0;
  v_card_type text;
  v_card_name text;
  v_card_faction text;
  v_rarity integer;
  v_current_health integer;
  v_inserted boolean;
  v_template record;
BEGIN
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
    v_card_name := v_card_json->>'name';
    v_card_faction := v_card_json->>'faction';
    v_rarity := COALESCE((v_card_json->>'rarity')::integer, 1);
    
    v_card_type := CASE 
      WHEN v_card_json->>'type' = 'pet' THEN 'dragon'
      WHEN v_card_json->>'type' IN ('worker','workers') THEN 'workers'
      WHEN v_card_json->>'type' = 'character' THEN 'hero'
      ELSE 'hero' 
    END;

    -- Skip workers
    IF v_card_type = 'workers' THEN
      CONTINUE;
    END IF;

    -- Get stats from card_templates for heroes and dragons
    SELECT power, defense, health, magic
    INTO v_template
    FROM public.card_templates
    WHERE card_name = v_card_name
      AND card_type = v_card_type
      AND rarity = v_rarity
      AND (faction = v_card_faction OR (faction IS NULL AND v_card_faction IS NULL))
    LIMIT 1;

    -- Skip if template not found
    IF NOT FOUND THEN
      RAISE WARNING 'Template not found for card: name=%, type=%, faction=%, rarity=%', 
        v_card_name, v_card_type, v_card_faction, v_rarity;
      CONTINUE;
    END IF;

    v_current_health := COALESCE((v_card_json->>'currentHealth')::integer, v_template.health);
    v_current_health := LEAST(v_current_health, v_template.health);

    WITH upsert AS (
      INSERT INTO public.card_instances (
        wallet_address,
        user_id,
        card_template_id,
        card_type,
        current_health,
        max_health,
        current_defense,
        max_defense,
        max_power,
        max_magic,
        last_heal_time,
        card_data
      ) VALUES (
        p_wallet_address,
        v_game_data.user_id,
        v_card_json->>'id',
        v_card_type,
        v_current_health,
        v_template.health,
        v_template.defense,
        v_template.defense,
        v_template.power,
        v_template.magic,
        COALESCE(to_timestamp((v_card_json->>'lastHealTime')::bigint / 1000.0), now()),
        v_card_json
      )
      ON CONFLICT (wallet_address, card_template_id)
      DO UPDATE SET 
        max_health = EXCLUDED.max_health,
        max_defense = EXCLUDED.max_defense,
        max_power = EXCLUDED.max_power,
        max_magic = EXCLUDED.max_magic,
        current_health = LEAST(public.card_instances.current_health, EXCLUDED.max_health),
        current_defense = LEAST(public.card_instances.current_defense, EXCLUDED.max_defense),
        last_heal_time = COALESCE(public.card_instances.last_heal_time, EXCLUDED.last_heal_time),
        card_data = EXCLUDED.card_data,
        updated_at = now()
      RETURNING (xmax = 0) AS inserted
    )
    SELECT inserted INTO v_inserted FROM upsert;

    IF v_inserted THEN
      v_synced_count := v_synced_count + 1;
    END IF;
  END LOOP;

  RETURN v_synced_count;
END;
$$;