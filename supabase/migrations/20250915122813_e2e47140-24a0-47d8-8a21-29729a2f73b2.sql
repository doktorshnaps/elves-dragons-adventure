-- Sync existing card_instances health from game_data.cards (reflect recent battles)
CREATE OR REPLACE FUNCTION public.sync_card_instances_health_from_game_data(p_wallet_address text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_game_data RECORD;
  v_card_json jsonb;
  v_updated_count integer := 0;
  v_template_id text;
  v_current integer;
  v_health integer;
  v_last_heal_ts timestamptz;
  v_temp_count integer;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  SELECT * INTO v_game_data
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_game_data IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_card_json IN SELECT * FROM jsonb_array_elements(COALESCE(v_game_data.cards, '[]'::jsonb))
  LOOP
    v_template_id := v_card_json->>'id';
    v_health := COALESCE((v_card_json->>'health')::integer, 0);
    v_current := COALESCE((v_card_json->>'currentHealth')::integer, v_health);
    v_last_heal_ts := COALESCE(
      to_timestamp(NULLIF(v_card_json->>'lastHealTime','')::bigint / 1000.0),
      NULL
    );

    -- Update only if instance exists and value differs
    UPDATE public.card_instances ci
    SET 
      current_health = LEAST(GREATEST(0, v_current), ci.max_health),
      last_heal_time = COALESCE(v_last_heal_ts, last_heal_time),
      updated_at = now()
    WHERE ci.wallet_address = p_wallet_address
      AND ci.card_template_id = v_template_id
      AND (ci.current_health <> LEAST(GREATEST(0, v_current), ci.max_health)
           OR (v_last_heal_ts IS NOT NULL AND ci.last_heal_time IS DISTINCT FROM v_last_heal_ts));

    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    v_updated_count := v_updated_count + v_temp_count;
  END LOOP;

  RETURN v_updated_count;
END;
$$;