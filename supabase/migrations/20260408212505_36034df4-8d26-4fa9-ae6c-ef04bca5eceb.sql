
-- Drop old function to avoid overload conflicts
DROP FUNCTION IF EXISTS apply_battle_rewards_v2(text, text, numeric, numeric, jsonb, jsonb, jsonb, jsonb);

CREATE OR REPLACE FUNCTION apply_battle_rewards_v2(
  p_wallet_address TEXT,
  p_claim_key TEXT,
  p_ell_reward NUMERIC,
  p_experience_reward NUMERIC,
  p_items JSONB,
  p_card_kills JSONB,
  p_card_health_updates JSONB,
  p_treasure_hunt_findings JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_current_exp NUMERIC;
  v_game_data_id TEXT;
  v_item JSONB;
  v_card_kill JSONB;
  v_card_update JSONB;
  v_th_finding JSONB;
  v_items_added INTEGER := 0;
  v_cards_updated INTEGER := 0;
  v_th_findings_added INTEGER := 0;
  v_existing_claim_id UUID;
BEGIN
  -- ============ STEP 0: IDEMPOTENCY CHECK (inside transaction) ============
  -- Check if this claim was already processed
  SELECT id INTO v_existing_claim_id
  FROM reward_claims
  WHERE claim_key = p_claim_key;

  IF v_existing_claim_id IS NOT NULL THEN
    -- Already claimed, return success without re-applying
    RETURN jsonb_build_object(
      'already_claimed', true,
      'claim_id', v_existing_claim_id
    );
  END IF;

  -- Insert idempotency record INSIDE the transaction
  INSERT INTO reward_claims (wallet_address, claim_key)
  VALUES (p_wallet_address, p_claim_key);

  -- ============ STEP 1: UPDATE GAME DATA ============
  SELECT id, balance, account_experience
  INTO v_game_data_id, v_current_balance, v_current_exp
  FROM game_data
  WHERE wallet_address = p_wallet_address;

  IF v_game_data_id IS NULL THEN
    RAISE EXCEPTION 'Player not found: %', p_wallet_address;
  END IF;

  UPDATE game_data
  SET 
    balance = balance + p_ell_reward,
    account_experience = account_experience + p_experience_reward,
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;

  -- ============ STEP 2: ADD ITEMS ============
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO item_instances (
      wallet_address,
      template_id,
      item_id,
      name,
      type
    )
    VALUES (
      p_wallet_address,
      (v_item->>'template_id')::INTEGER,
      v_item->>'item_id',
      v_item->>'name',
      v_item->>'type'
    );
    v_items_added := v_items_added + 1;
  END LOOP;

  -- ============ STEP 3: UPDATE CARD KILLS ============
  FOR v_card_kill IN SELECT * FROM jsonb_array_elements(p_card_kills)
  LOOP
    UPDATE card_instances
    SET monster_kills = monster_kills + (v_card_kill->>'kills')::INTEGER
    WHERE wallet_address = p_wallet_address
      AND card_template_id = v_card_kill->>'card_template_id';
  END LOOP;

  -- ============ STEP 4: UPDATE CARD HEALTH ============
  FOR v_card_update IN SELECT * FROM jsonb_array_elements(p_card_health_updates)
  LOOP
    UPDATE card_instances
    SET 
      current_health = LEAST(
        GREATEST((v_card_update->>'current_health')::INTEGER, 0),
        max_health
      ),
      current_defense = LEAST(
        GREATEST((v_card_update->>'current_defense')::INTEGER, 0),
        max_defense
      ),
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address
      AND id = (v_card_update->>'card_instance_id')::uuid;
    
    IF FOUND THEN
      v_cards_updated := v_cards_updated + 1;
    END IF;
  END LOOP;

  -- ============ STEP 5: TREASURE HUNT FINDINGS (atomic) ============
  FOR v_th_finding IN SELECT * FROM jsonb_array_elements(p_treasure_hunt_findings)
  LOOP
    -- Upsert: increment if exists, insert if not
    INSERT INTO treasure_hunt_findings (
      event_id,
      wallet_address,
      found_quantity,
      found_at
    )
    VALUES (
      (v_th_finding->>'event_id')::uuid,
      p_wallet_address,
      (v_th_finding->>'quantity')::integer,
      NOW()
    )
    ON CONFLICT (event_id, wallet_address) 
    DO UPDATE SET 
      found_quantity = treasure_hunt_findings.found_quantity + (v_th_finding->>'quantity')::integer,
      found_at = NOW(),
      updated_at = NOW();
    
    v_th_findings_added := v_th_findings_added + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'already_claimed', false,
    'balance_added', p_ell_reward,
    'experience_added', p_experience_reward,
    'items_added', v_items_added,
    'cards_updated', v_cards_updated,
    'treasure_hunt_findings_added', v_th_findings_added,
    'new_balance', v_current_balance + p_ell_reward,
    'new_experience', v_current_exp + p_experience_reward
  );
END;
$$;

-- Add unique constraint on treasure_hunt_findings if not exists
-- (needed for ON CONFLICT upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'treasure_hunt_findings_event_wallet_unique'
  ) THEN
    ALTER TABLE treasure_hunt_findings 
    ADD CONSTRAINT treasure_hunt_findings_event_wallet_unique 
    UNIQUE (event_id, wallet_address);
  END IF;
END $$;
