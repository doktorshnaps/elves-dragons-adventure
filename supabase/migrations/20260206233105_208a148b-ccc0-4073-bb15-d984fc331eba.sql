
-- Rewrite update_pvp_elo with dynamic Elo calculation (K-factor by tier)
-- Now calculates elo change internally and returns it
CREATE OR REPLACE FUNCTION public.update_pvp_elo(
  p_winner_wallet text,
  p_loser_wallet text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
  v_winner_elo integer;
  v_loser_elo integer;
  v_winner_k integer;
  v_loser_k integer;
  v_expected_win double precision;
  v_winner_gain integer;
  v_loser_loss integer;
  v_elo_change integer;
  v_is_bot_winner boolean := false;
  v_is_bot_loser boolean := false;
BEGIN
  -- Get active season
  SELECT get_active_pvp_season() INTO v_season_id;
  
  IF v_season_id IS NULL THEN
    RAISE NOTICE 'No active PvP season found, skipping ELO update';
    RETURN 0;
  END IF;

  -- Determine if winner/loser are bots
  v_is_bot_winner := (p_winner_wallet IS NULL OR p_winner_wallet LIKE 'BOT_%' OR p_winner_wallet = 'SKIP_BOT');
  v_is_bot_loser := (p_loser_wallet IS NULL OR p_loser_wallet LIKE 'BOT_%' OR p_loser_wallet = 'SKIP_BOT');

  -- If both are bots/skipped, nothing to do
  IF v_is_bot_winner AND v_is_bot_loser THEN
    RETURN 0;
  END IF;

  -- Ensure rating records exist for real players
  IF NOT v_is_bot_winner THEN
    INSERT INTO public.pvp_ratings (wallet_address, season_id, elo, tier, wins, losses, win_streak, best_win_streak, matches_played)
    VALUES (p_winner_wallet, v_season_id, 1000, 'bronze', 0, 0, 0, 0, 0)
    ON CONFLICT (wallet_address, season_id) DO NOTHING;
  END IF;

  IF NOT v_is_bot_loser THEN
    INSERT INTO public.pvp_ratings (wallet_address, season_id, elo, tier, wins, losses, win_streak, best_win_streak, matches_played)
    VALUES (p_loser_wallet, v_season_id, 1000, 'bronze', 0, 0, 0, 0, 0)
    ON CONFLICT (wallet_address, season_id) DO NOTHING;
  END IF;

  -- Get current Elo values (use 1000 for bots)
  IF v_is_bot_winner THEN
    v_winner_elo := 1000;
  ELSE
    SELECT elo INTO v_winner_elo FROM public.pvp_ratings
    WHERE wallet_address = p_winner_wallet AND season_id = v_season_id;
  END IF;

  IF v_is_bot_loser THEN
    v_loser_elo := 1000;
  ELSE
    SELECT elo INTO v_loser_elo FROM public.pvp_ratings
    WHERE wallet_address = p_loser_wallet AND season_id = v_season_id;
  END IF;

  -- Determine K-factor based on player's Elo tier
  -- Bronze-Gold (0-1599): K=32, Platinum-Diamond (1600-1999): K=24, Master-Legend (2000+): K=16
  IF v_winner_elo >= 2000 THEN v_winner_k := 16;
  ELSIF v_winner_elo >= 1600 THEN v_winner_k := 24;
  ELSE v_winner_k := 32;
  END IF;

  IF v_loser_elo >= 2000 THEN v_loser_k := 16;
  ELSIF v_loser_elo >= 1600 THEN v_loser_k := 24;
  ELSE v_loser_k := 32;
  END IF;

  -- For bot matches, use fixed K=32
  IF v_is_bot_winner OR v_is_bot_loser THEN
    v_winner_k := 32;
    v_loser_k := 32;
  END IF;

  -- Calculate expected win probability for the winner
  v_expected_win := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::double precision / 400.0));

  -- Calculate Elo changes (asymmetric due to different K-factors)
  v_winner_gain := GREATEST(1, round(v_winner_k * (1.0 - v_expected_win))::integer);
  v_loser_loss := GREATEST(1, round(v_loser_k * v_expected_win)::integer);

  -- Average for the match record
  v_elo_change := GREATEST(1, round((v_winner_gain + v_loser_loss)::double precision / 2.0)::integer);

  -- Update winner stats
  IF NOT v_is_bot_winner THEN
    UPDATE public.pvp_ratings
    SET 
      elo = elo + v_winner_gain,
      wins = wins + 1,
      matches_played = matches_played + 1,
      win_streak = win_streak + 1,
      best_win_streak = GREATEST(best_win_streak, win_streak + 1),
      tier = get_elo_tier(elo + v_winner_gain),
      updated_at = now()
    WHERE wallet_address = p_winner_wallet AND season_id = v_season_id;
  END IF;

  -- Update loser stats
  IF NOT v_is_bot_loser THEN
    UPDATE public.pvp_ratings
    SET 
      elo = GREATEST(0, elo - v_loser_loss),
      losses = losses + 1,
      matches_played = matches_played + 1,
      win_streak = 0,
      tier = get_elo_tier(GREATEST(0, elo - v_loser_loss)),
      updated_at = now()
    WHERE wallet_address = p_loser_wallet AND season_id = v_season_id;
  END IF;

  RETURN v_elo_change;
END;
$$;
