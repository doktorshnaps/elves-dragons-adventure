CREATE OR REPLACE FUNCTION public.submit_item_exchange(p_wallet_address text, p_exchange_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template_id UUID;
  v_required JSONB;
  v_rewards JSONB;
  v_reward_ell INTEGER;
  v_item JSONB;
  v_owned_count INTEGER;
  v_needed INTEGER;
  v_tmpl_id INTEGER;
  v_delete_ids UUID[];
  v_temp_ids UUID[];
  v_user_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Lock the exchange row to prevent double submission (FOR UPDATE NOWAIT)
  SELECT ue.template_id INTO v_template_id
  FROM user_item_exchanges ue
  WHERE ue.id = p_exchange_id
    AND ue.wallet_address = p_wallet_address
    AND ue.assigned_date = CURRENT_DATE
    AND ue.is_completed = false
  FOR UPDATE SKIP LOCKED;

  IF v_template_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Exchange not found or already completed');
  END IF;

  -- Mark completed IMMEDIATELY to prevent any race condition
  UPDATE user_item_exchanges
  SET is_completed = true, is_claimed = true, updated_at = now()
  WHERE id = p_exchange_id AND is_completed = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Exchange already completed (race)');
  END IF;

  -- Get template
  SELECT t.required_items, t.reward_items, t.reward_ell
  INTO v_required, v_rewards, v_reward_ell
  FROM item_exchange_templates t
  WHERE t.id = v_template_id;

  -- Get user_id
  SELECT p.user_id INTO v_user_id
  FROM profiles p WHERE p.wallet_address = p_wallet_address LIMIT 1;

  -- Check and collect items to delete
  v_delete_ids := ARRAY[]::UUID[];
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_required) LOOP
    v_tmpl_id := (v_item->>'template_id')::INTEGER;
    v_needed := (v_item->>'quantity')::INTEGER;

    SELECT array_agg(ii.id) INTO v_temp_ids
    FROM (
      SELECT ii2.id FROM item_instances ii2
      WHERE ii2.wallet_address = p_wallet_address
        AND ii2.template_id = v_tmpl_id
      LIMIT v_needed
    ) ii;

    IF v_temp_ids IS NULL OR array_length(v_temp_ids, 1) < v_needed THEN
      -- Rollback: unmark completed
      UPDATE user_item_exchanges
      SET is_completed = false, is_claimed = false, updated_at = now()
      WHERE id = p_exchange_id;
      RETURN jsonb_build_object('success', false, 'error', 'Not enough items: template_id=' || v_tmpl_id);
    END IF;

    v_delete_ids := v_delete_ids || v_temp_ids;
  END LOOP;

  -- Delete required items
  DELETE FROM item_instances WHERE id = ANY(v_delete_ids);

  -- Give reward items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_rewards) LOOP
    v_tmpl_id := (v_item->>'template_id')::INTEGER;
    v_needed := (v_item->>'quantity')::INTEGER;

    FOR i IN 1..v_needed LOOP
      INSERT INTO item_instances (wallet_address, user_id, template_id, item_id, name, type)
      SELECT p_wallet_address, v_user_id, it.id, it.item_id, it.name, it.type
      FROM item_templates it WHERE it.id = v_tmpl_id;
    END LOOP;
  END LOOP;

  -- Give ELL reward
  IF v_reward_ell > 0 THEN
    UPDATE game_data SET balance = balance + v_reward_ell, updated_at = now()
    WHERE wallet_address = p_wallet_address;

    SELECT balance INTO v_current_balance FROM game_data WHERE wallet_address = p_wallet_address;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reward_ell', v_reward_ell,
    'new_balance', COALESCE(v_current_balance, 0)
  );
END;
$function$;