-- Recreate start_bot_match with transactional advisory lock to prevent concurrent duplicate creation
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
BEGIN
  -- ✅ Hard lock per (player_wallet, rarity_tier) for the duration of this transaction.
  -- Prevents two concurrent RPC calls from both creating a match.
  PERFORM pg_advisory_xact_lock(hashtext(p_player_wallet), p_rarity_tier);

  -- ✅ If duplicates already exist (from previous bug), keep the newest and cancel the rest.
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

  -- ✅ If an active bot match already exists, return it (no extra fee deduction).
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

  -- Deduct entry fee from player only (bot doesn't pay)
  UPDATE game_data
  SET balance = balance - v_entry_fee
  WHERE wallet_address = p_player_wallet;

  -- Create initial battle state
  v_initial_state := jsonb_build_object(
    'player1_pairs', p_player_team_snapshot,
    'player2_pairs', p_bot_team_snapshot,
    'turn_number', 1,
    'current_turn', 'player1'
  );

  -- Create match marked as bot match
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
    p_player_wallet, now(),
    true, p_bot_owner_wallet,
    now(), 'ranked'
  )
  RETURNING id INTO v_match_id;

  -- Clear the player from queue if they were in it
  DELETE FROM pvp_queue WHERE wallet_address = p_player_wallet;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', v_match_id,
    'is_bot_match', true
  );
END;
$$;