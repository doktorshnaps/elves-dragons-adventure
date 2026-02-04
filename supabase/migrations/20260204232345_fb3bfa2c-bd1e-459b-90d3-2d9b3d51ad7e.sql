-- Create function to update PvP ELO ratings after a match
CREATE OR REPLACE FUNCTION public.update_pvp_elo(
  p_winner_wallet text,
  p_loser_wallet text,
  p_elo_change integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
BEGIN
  -- Get active season
  SELECT get_active_pvp_season() INTO v_season_id;
  
  IF v_season_id IS NULL THEN
    RAISE NOTICE 'No active PvP season found, skipping ELO update';
    RETURN;
  END IF;
  
  -- Update winner's ELO (skip if winner is a bot or SKIP_BOT)
  IF p_winner_wallet IS NOT NULL 
     AND NOT p_winner_wallet LIKE 'BOT_%' 
     AND p_winner_wallet != 'SKIP_BOT' THEN
    
    -- Ensure winner has a rating record
    INSERT INTO public.pvp_ratings (wallet_address, season_id, elo, tier, wins, losses, win_streak, best_win_streak, matches_played)
    VALUES (p_winner_wallet, v_season_id, 1000, 'bronze', 0, 0, 0, 0, 0)
    ON CONFLICT (wallet_address, season_id) DO NOTHING;
    
    -- Update winner stats
    UPDATE public.pvp_ratings
    SET 
      elo = elo + p_elo_change,
      wins = wins + 1,
      matches_played = matches_played + 1,
      win_streak = win_streak + 1,
      best_win_streak = GREATEST(best_win_streak, win_streak + 1),
      tier = get_elo_tier(elo + p_elo_change),
      updated_at = now()
    WHERE wallet_address = p_winner_wallet AND season_id = v_season_id;
  END IF;
  
  -- Update loser's ELO (skip if loser is a bot or SKIP_BOT)
  IF p_loser_wallet IS NOT NULL 
     AND NOT p_loser_wallet LIKE 'BOT_%' 
     AND p_loser_wallet != 'SKIP_BOT' THEN
    
    -- Ensure loser has a rating record
    INSERT INTO public.pvp_ratings (wallet_address, season_id, elo, tier, wins, losses, win_streak, best_win_streak, matches_played)
    VALUES (p_loser_wallet, v_season_id, 1000, 'bronze', 0, 0, 0, 0, 0)
    ON CONFLICT (wallet_address, season_id) DO NOTHING;
    
    -- Update loser stats
    UPDATE public.pvp_ratings
    SET 
      elo = GREATEST(0, elo - p_elo_change),
      losses = losses + 1,
      matches_played = matches_played + 1,
      win_streak = 0,
      tier = get_elo_tier(GREATEST(0, elo - p_elo_change)),
      updated_at = now()
    WHERE wallet_address = p_loser_wallet AND season_id = v_season_id;
  END IF;
END;
$$;