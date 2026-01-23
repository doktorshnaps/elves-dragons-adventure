-- Create function to toggle bot team availability
CREATE OR REPLACE FUNCTION toggle_bot_team_availability(
  p_wallet_address TEXT,
  p_rarity_tier INTEGER,
  p_team_snapshot JSONB,
  p_elo INTEGER,
  p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_is_active THEN
    -- Insert or update bot team
    INSERT INTO pvp_bot_teams (wallet_address, rarity_tier, team_snapshot, elo, is_active)
    VALUES (p_wallet_address, p_rarity_tier, p_team_snapshot, p_elo, true)
    ON CONFLICT (wallet_address, rarity_tier)
    DO UPDATE SET 
      team_snapshot = EXCLUDED.team_snapshot,
      elo = EXCLUDED.elo,
      is_active = true,
      updated_at = now();
  ELSE
    -- Deactivate bot team
    UPDATE pvp_bot_teams
    SET is_active = false, updated_at = now()
    WHERE wallet_address = p_wallet_address AND rarity_tier = p_rarity_tier;
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create function to find a bot team for matching
CREATE OR REPLACE FUNCTION find_bot_opponent(
  p_wallet_address TEXT,
  p_rarity_tier INTEGER,
  p_player_elo INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bot_team RECORD;
  v_elo_range INTEGER := 200;
BEGIN
  -- Find a bot team that is:
  -- 1. Not owned by the searching player
  -- 2. Same rarity tier
  -- 3. Within Elo range (expanding gradually)
  SELECT * INTO v_bot_team
  FROM pvp_bot_teams
  WHERE wallet_address != p_wallet_address
    AND rarity_tier = p_rarity_tier
    AND is_active = true
    AND ABS(elo - p_player_elo) <= v_elo_range
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- If not found, try wider Elo range
  IF v_bot_team IS NULL THEN
    SELECT * INTO v_bot_team
    FROM pvp_bot_teams
    WHERE wallet_address != p_wallet_address
      AND rarity_tier = p_rarity_tier
      AND is_active = true
    ORDER BY ABS(elo - p_player_elo)
    LIMIT 1;
  END IF;
  
  IF v_bot_team IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  
  RETURN jsonb_build_object(
    'found', true,
    'bot_id', v_bot_team.id,
    'bot_owner_wallet', v_bot_team.wallet_address,
    'team_snapshot', v_bot_team.team_snapshot,
    'elo', v_bot_team.elo
  );
END;
$$;

-- Create function to start a bot match
CREATE OR REPLACE FUNCTION start_bot_match(
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
BEGIN
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
    is_bot_match, bot_owner_wallet
  ) VALUES (
    p_player_wallet, 'BOT_' || p_bot_owner_wallet,
    p_player_team_snapshot, p_bot_team_snapshot,
    p_player_elo, p_bot_elo,
    p_rarity_tier, v_entry_fee,
    'active', v_initial_state,
    p_player_wallet, now(),
    true, p_bot_owner_wallet
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

-- Create function to get bot team status for a wallet
CREATE OR REPLACE FUNCTION get_bot_team_status(
  p_wallet_address TEXT
)
RETURNS TABLE (
  rarity_tier INTEGER,
  is_active BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT bt.rarity_tier, bt.is_active, bt.updated_at
  FROM pvp_bot_teams bt
  WHERE bt.wallet_address = p_wallet_address;
END;
$$;