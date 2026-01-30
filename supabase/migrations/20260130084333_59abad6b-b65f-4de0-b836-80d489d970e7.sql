-- Add initiative_phase and initiative_rolls to battle_state
-- Update start_bot_match to include initiative roll at match start

DROP FUNCTION IF EXISTS public.start_bot_match(TEXT, INTEGER, JSONB, TEXT, JSONB, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.start_bot_match(
  p_player_wallet TEXT,
  p_rarity_tier INTEGER,
  p_player_team_snapshot JSONB,
  p_bot_owner_wallet TEXT,
  p_bot_team_snapshot JSONB,
  p_player_elo INTEGER,
  p_bot_elo INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id UUID;
  v_entry_fee INTEGER := 100;
  v_initial_state JSONB;
  v_existing_match_id UUID;
  v_bot_wallet TEXT := 'BOT_' || p_bot_owner_wallet;
  v_player_initiative INTEGER;
  v_bot_initiative INTEGER;
  v_first_turn_wallet TEXT;
BEGIN
  -- Lock to prevent concurrent duplicate creation
  PERFORM pg_advisory_xact_lock(hashtext(p_player_wallet), p_rarity_tier);

  -- Cancel existing duplicates
  WITH ranked AS (
    SELECT id,
           row_number() OVER (ORDER BY created_at DESC) AS rn
    FROM pvp_matches
    WHERE player1_wallet = p_player_wallet
      AND player2_wallet = v_bot_wallet
      AND is_bot_match = true
      AND status = 'active'
      AND rarity_tier = p_rarity_tier
  )
  UPDATE pvp_matches
  SET status = 'cancelled',
      finished_at = now()
  WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

  -- Return existing if found
  SELECT id INTO v_existing_match_id
  FROM pvp_matches
  WHERE player1_wallet = p_player_wallet
    AND player2_wallet = v_bot_wallet
    AND is_bot_match = true
    AND status = 'active'
    AND rarity_tier = p_rarity_tier
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_match_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'match_id', v_existing_match_id,
      'is_bot_match', true,
      'already_exists', true
    );
  END IF;

  -- Check player balance
  IF (SELECT balance FROM game_data WHERE wallet_address = p_player_wallet) < v_entry_fee THEN
    RETURN jsonb_build_object('error', 'Insufficient balance');
  END IF;

  -- Deduct entry fee
  UPDATE game_data
  SET balance = balance - v_entry_fee
  WHERE wallet_address = p_player_wallet;

  -- Roll initiative dice (d6) for both players - reroll on ties
  LOOP
    v_player_initiative := floor(random() * 6 + 1)::INTEGER;
    v_bot_initiative := floor(random() * 6 + 1)::INTEGER;
    EXIT WHEN v_player_initiative != v_bot_initiative;
  END LOOP;
  
  -- Determine who goes first (higher roll wins)
  IF v_player_initiative > v_bot_initiative THEN
    v_first_turn_wallet := p_player_wallet;
  ELSE
    v_first_turn_wallet := v_bot_wallet;
  END IF;

  -- Create initial battle state with initiative info
  v_initial_state := jsonb_build_object(
    'player1_pairs', p_player_team_snapshot,
    'player2_pairs', p_bot_team_snapshot,
    'turn_number', 1,
    'current_turn', CASE WHEN v_first_turn_wallet = p_player_wallet THEN 'player1' ELSE 'player2' END,
    'initiative', jsonb_build_object(
      'player1_roll', v_player_initiative,
      'player2_roll', v_bot_initiative,
      'first_turn', CASE WHEN v_first_turn_wallet = p_player_wallet THEN 'player1' ELSE 'player2' END
    )
  );

  -- Create match
  INSERT INTO pvp_matches (
    player1_wallet, player2_wallet,
    player1_team_snapshot, player2_team_snapshot,
    player1_elo_before, player2_elo_before,
    rarity_tier, entry_fee,
    status, battle_state,
    current_turn_wallet, turn_started_at,
    is_bot_match, bot_owner_wallet,
    started_at, match_type
  ) VALUES (
    p_player_wallet, v_bot_wallet,
    p_player_team_snapshot, p_bot_team_snapshot,
    p_player_elo, p_bot_elo,
    p_rarity_tier, v_entry_fee,
    'active', v_initial_state,
    v_first_turn_wallet, now(),
    true, p_bot_owner_wallet,
    now(), 'ranked'
  )
  RETURNING id INTO v_match_id;

  -- Clear player from queue
  DELETE FROM pvp_queue WHERE wallet_address = p_player_wallet;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', v_match_id,
    'is_bot_match', true,
    'initiative', jsonb_build_object(
      'player_roll', v_player_initiative,
      'bot_roll', v_bot_initiative,
      'player_goes_first', v_first_turn_wallet = p_player_wallet
    )
  );
END;
$$;

-- Also update find_pvp_match to include initiative when matching real players
CREATE OR REPLACE FUNCTION public.find_pvp_match(p_wallet_address TEXT)
RETURNS JSONB
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
    AND status = 'searching'
    AND expires_at > now()
  LIMIT 1;

  IF v_queue_record IS NULL THEN
    RETURN jsonb_build_object('status', 'not_in_queue');
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