-- =============================================
-- Fix: join_pvp_queue to handle duplicate constraint gracefully
-- and return existing queue entry if already searching
-- =============================================

CREATE OR REPLACE FUNCTION public.join_pvp_queue(
  p_wallet_address text, 
  p_rarity_tier integer, 
  p_team_snapshot jsonb, 
  p_match_type text DEFAULT 'ranked'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- If already in queue, return existing entry (not an error)
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'queue_id', v_existing.id,
      'already_in_queue', true
    );
  END IF;

  -- Delete any old/expired entries for this wallet (clean up)
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

  -- Insert new queue entry with ON CONFLICT to handle race conditions
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
  ON CONFLICT (wallet_address) WHERE status = 'searching'
  DO UPDATE SET
    rarity_tier = EXCLUDED.rarity_tier,
    team_snapshot = EXCLUDED.team_snapshot,
    current_elo = EXCLUDED.current_elo,
    joined_at = now(),
    expires_at = now() + interval '5 minutes'
  RETURNING id INTO v_queue_id;

  RETURN jsonb_build_object(
    'success', true,
    'queue_id', v_queue_id
  );
  
EXCEPTION WHEN unique_violation THEN
  -- Race condition: another request already created the entry
  -- Find and return the existing entry
  SELECT id INTO v_queue_id
  FROM pvp_queue
  WHERE wallet_address = p_wallet_address
    AND status = 'searching'
  LIMIT 1;
  
  IF v_queue_id IS NOT NULL THEN
    -- Refund the fee since we didn't actually create a new entry
    UPDATE game_data
    SET balance = balance + v_entry_fee
    WHERE wallet_address = p_wallet_address;
    
    RETURN jsonb_build_object(
      'success', true,
      'queue_id', v_queue_id,
      'already_in_queue', true
    );
  ELSE
    RETURN jsonb_build_object('error', 'Ошибка при присоединении к очереди');
  END IF;
END;
$function$;