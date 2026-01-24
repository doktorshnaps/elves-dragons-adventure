-- Drop and recreate join_pvp_queue function with proper duplicate handling
CREATE OR REPLACE FUNCTION join_pvp_queue(
  p_wallet_address TEXT,
  p_rarity_tier INTEGER,
  p_team_snapshot JSONB,
  p_match_type TEXT DEFAULT 'ranked'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue_id UUID;
  v_existing RECORD;
  v_entry_fee INTEGER := 100;
  v_player_elo INTEGER;
BEGIN
  -- Get player's current ELO
  SELECT elo INTO v_player_elo
  FROM pvp_ratings
  WHERE wallet_address = p_wallet_address
  LIMIT 1;
  
  IF v_player_elo IS NULL THEN
    v_player_elo := 1000;
  END IF;

  -- Check if player is already in queue (non-expired, searching)
  SELECT * INTO v_existing
  FROM pvp_queue
  WHERE wallet_address = p_wallet_address
    AND status = 'searching'
    AND expires_at > now()
  LIMIT 1;
  
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'error', 'Already in queue',
      'queue_id', v_existing.id
    );
  END IF;

  -- Delete any old/expired entries for this wallet
  DELETE FROM pvp_queue 
  WHERE wallet_address = p_wallet_address;

  -- Check player balance
  IF (SELECT balance FROM game_data WHERE wallet_address = p_wallet_address) < v_entry_fee THEN
    RETURN jsonb_build_object('error', 'Баланс ELL недостаточен для входа в PvP');
  END IF;

  -- Deduct entry fee
  UPDATE game_data
  SET balance = balance - v_entry_fee
  WHERE wallet_address = p_wallet_address;

  -- Insert new queue entry
  INSERT INTO pvp_queue (
    wallet_address,
    match_type,
    rarity_tier,
    current_elo,
    team_snapshot,
    joined_at,
    expires_at,
    status
  ) VALUES (
    p_wallet_address,
    p_match_type,
    p_rarity_tier,
    v_player_elo,
    p_team_snapshot,
    now(),
    now() + interval '5 minutes',
    'searching'
  )
  RETURNING id INTO v_queue_id;

  RETURN jsonb_build_object(
    'success', true,
    'queue_id', v_queue_id
  );
END;
$$;

-- Drop and recreate find_pvp_match function to actually match players
CREATE OR REPLACE FUNCTION find_pvp_match(
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_queue RECORD;
  v_opponent RECORD;
  v_match_id UUID;
  v_initial_state JSONB;
  v_elo_range INTEGER := 200;
BEGIN
  -- Get my queue entry
  SELECT * INTO v_my_queue
  FROM pvp_queue
  WHERE wallet_address = p_wallet_address
    AND status = 'searching'
    AND expires_at > now()
  LIMIT 1;
  
  IF v_my_queue.id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'Not in queue');
  END IF;
  
  -- Check if already matched
  IF v_my_queue.match_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'match_id', v_my_queue.match_id,
      'already_matched', true
    );
  END IF;

  -- Find opponent: same rarity_tier, match_type, within ELO range, not self
  SELECT * INTO v_opponent
  FROM pvp_queue
  WHERE wallet_address != p_wallet_address
    AND rarity_tier = v_my_queue.rarity_tier
    AND match_type = v_my_queue.match_type
    AND status = 'searching'
    AND expires_at > now()
    AND match_id IS NULL
    AND ABS(current_elo - v_my_queue.current_elo) <= v_elo_range
  ORDER BY joined_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- If not found within range, try any player in same tier
  IF v_opponent.id IS NULL THEN
    SELECT * INTO v_opponent
    FROM pvp_queue
    WHERE wallet_address != p_wallet_address
      AND rarity_tier = v_my_queue.rarity_tier
      AND match_type = v_my_queue.match_type
      AND status = 'searching'
      AND expires_at > now()
      AND match_id IS NULL
    ORDER BY ABS(current_elo - v_my_queue.current_elo), joined_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  IF v_opponent.id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'No opponent found');
  END IF;

  -- Create initial battle state
  v_initial_state := jsonb_build_object(
    'player1_pairs', v_my_queue.team_snapshot,
    'player2_pairs', v_opponent.team_snapshot,
    'turn_number', 1,
    'current_turn', 'player1'
  );

  -- Create match
  INSERT INTO pvp_matches (
    player1_wallet, player2_wallet,
    player1_team_snapshot, player2_team_snapshot,
    player1_elo_before, player2_elo_before,
    rarity_tier, entry_fee,
    status, battle_state,
    current_turn_wallet, turn_started_at,
    started_at, match_type
  ) VALUES (
    p_wallet_address, v_opponent.wallet_address,
    v_my_queue.team_snapshot, v_opponent.team_snapshot,
    v_my_queue.current_elo, v_opponent.current_elo,
    v_my_queue.rarity_tier, 100,
    'active', v_initial_state,
    p_wallet_address, now(),
    now(), v_my_queue.match_type
  )
  RETURNING id INTO v_match_id;

  -- Update both queue entries as matched
  UPDATE pvp_queue
  SET status = 'matched',
      match_id = v_match_id,
      matched_with_wallet = v_opponent.wallet_address
  WHERE id = v_my_queue.id;
  
  UPDATE pvp_queue
  SET status = 'matched',
      match_id = v_match_id,
      matched_with_wallet = p_wallet_address
  WHERE id = v_opponent.id;

  RETURN jsonb_build_object(
    'found', true,
    'match_id', v_match_id,
    'opponent_wallet', v_opponent.wallet_address
  );
END;
$$;

-- Drop and recreate leave_pvp_queue to refund entry fee
CREATE OR REPLACE FUNCTION leave_pvp_queue(
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue RECORD;
  v_entry_fee INTEGER := 100;
BEGIN
  -- Find and delete queue entry
  DELETE FROM pvp_queue
  WHERE wallet_address = p_wallet_address
    AND status = 'searching'
  RETURNING * INTO v_queue;
  
  IF v_queue.id IS NOT NULL THEN
    -- Refund entry fee
    UPDATE game_data
    SET balance = balance + v_entry_fee
    WHERE wallet_address = p_wallet_address;
    
    RETURN jsonb_build_object('success', true, 'refunded', v_entry_fee);
  END IF;
  
  RETURN jsonb_build_object('success', false, 'reason', 'Not in queue');
END;
$$;

-- Clean up any duplicate/stale queue entries
DELETE FROM pvp_queue WHERE expires_at < now();

-- Add unique constraint to prevent duplicates in future
ALTER TABLE pvp_queue DROP CONSTRAINT IF EXISTS pvp_queue_wallet_unique;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pvp_queue_wallet_searching_unique'
  ) THEN
    -- We can't add partial unique index via ALTER, so create an index instead
    CREATE UNIQUE INDEX IF NOT EXISTS pvp_queue_wallet_searching_unique 
    ON pvp_queue (wallet_address) 
    WHERE status = 'searching';
  END IF;
END $$;