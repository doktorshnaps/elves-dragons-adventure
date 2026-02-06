
-- Fix find_pvp_match to check if player was already matched by another player
CREATE OR REPLACE FUNCTION public.find_pvp_match(p_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue_record RECORD;
  v_opponent_record RECORD;
  v_match_id UUID;
  v_entry_fee INTEGER := 100;
  v_initial_state JSONB;
  v_player_initiative INTEGER;
  v_opponent_initiative INTEGER;
  v_first_turn_wallet TEXT;
BEGIN
  -- Get our queue entry
  SELECT * INTO v_queue_record
  FROM pvp_queue
  WHERE wallet_address = p_wallet_address
    AND expires_at > now()
  LIMIT 1;

  IF v_queue_record IS NULL THEN
    RETURN jsonb_build_object('status', 'not_in_queue');
  END IF;

  -- ⭐ CRITICAL FIX: Check if we were already matched by another player's search
  IF v_queue_record.status = 'matched' AND v_queue_record.match_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'matched',
      'match_id', v_queue_record.match_id,
      'opponent_wallet', v_queue_record.matched_with_wallet
    );
  END IF;

  -- If not searching, something is wrong
  IF v_queue_record.status != 'searching' THEN
    RETURN jsonb_build_object('status', v_queue_record.status);
  END IF;

  -- Find a matching opponent
  SELECT * INTO v_opponent_record
  FROM pvp_queue
  WHERE wallet_address != p_wallet_address
    AND status = 'searching'
    AND rarity_tier = v_queue_record.rarity_tier
    AND match_type = v_queue_record.match_type
    AND expires_at > now()
    AND ABS(current_elo - v_queue_record.current_elo) <= 300
  ORDER BY joined_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_opponent_record IS NULL THEN
    RETURN jsonb_build_object('status', 'searching');
  END IF;

  -- Roll initiative dice for both players - reroll on ties
  LOOP
    v_player_initiative := floor(random() * 6 + 1)::INTEGER;
    v_opponent_initiative := floor(random() * 6 + 1)::INTEGER;
    EXIT WHEN v_player_initiative != v_opponent_initiative;
  END LOOP;
  
  -- Higher roll goes first
  IF v_player_initiative > v_opponent_initiative THEN
    v_first_turn_wallet := p_wallet_address;
  ELSE
    v_first_turn_wallet := v_opponent_record.wallet_address;
  END IF;

  -- Create battle state with initiative
  v_initial_state := jsonb_build_object(
    'player1_pairs', v_queue_record.team_snapshot,
    'player2_pairs', v_opponent_record.team_snapshot,
    'turn_number', 1,
    'current_turn', CASE WHEN v_first_turn_wallet = p_wallet_address THEN 'player1' ELSE 'player2' END,
    'initiative', jsonb_build_object(
      'player1_roll', v_player_initiative,
      'player2_roll', v_opponent_initiative,
      'first_turn', CASE WHEN v_first_turn_wallet = p_wallet_address THEN 'player1' ELSE 'player2' END
    )
  );

  -- Create the match
  INSERT INTO pvp_matches (
    player1_wallet, player2_wallet,
    player1_team_snapshot, player2_team_snapshot,
    player1_elo_before, player2_elo_before,
    rarity_tier, entry_fee,
    status, battle_state,
    current_turn_wallet, turn_started_at,
    started_at, match_type
  ) VALUES (
    p_wallet_address, v_opponent_record.wallet_address,
    v_queue_record.team_snapshot, v_opponent_record.team_snapshot,
    v_queue_record.current_elo, v_opponent_record.current_elo,
    v_queue_record.rarity_tier, v_entry_fee,
    'active', v_initial_state,
    v_first_turn_wallet, now(),
    now(), 'ranked'
  )
  RETURNING id INTO v_match_id;

  -- Update both queue entries
  UPDATE pvp_queue
  SET status = 'matched',
      match_id = v_match_id,
      matched_with_wallet = v_opponent_record.wallet_address
  WHERE wallet_address = p_wallet_address;

  UPDATE pvp_queue
  SET status = 'matched',
      match_id = v_match_id,
      matched_with_wallet = p_wallet_address
  WHERE wallet_address = v_opponent_record.wallet_address;

  RETURN jsonb_build_object(
    'status', 'matched',
    'match_id', v_match_id,
    'opponent_wallet', v_opponent_record.wallet_address,
    'initiative', jsonb_build_object(
      'your_roll', v_player_initiative,
      'opponent_roll', v_opponent_initiative,
      'you_go_first', v_first_turn_wallet = p_wallet_address
    )
  );
END;
$$;
