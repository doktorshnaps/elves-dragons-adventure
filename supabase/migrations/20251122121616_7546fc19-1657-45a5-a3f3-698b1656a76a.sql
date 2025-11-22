-- Fix get_game_data_by_wallet to match create_game_data_by_wallet return structure
CREATE OR REPLACE FUNCTION public.get_game_data_by_wallet(p_wallet_address text)
RETURNS TABLE(
  user_id uuid,
  balance integer,
  cards jsonb,
  selected_team jsonb,
  dragon_eggs jsonb,
  account_level integer,
  account_experience integer,
  initialized boolean,
  marketplace_listings jsonb,
  social_quests jsonb,
  adventure_player_stats jsonb,
  adventure_current_monster jsonb,
  battle_state jsonb,
  barracks_upgrades jsonb,
  dragon_lair_upgrades jsonb,
  active_workers jsonb,
  wood integer,
  stone integer,
  iron integer,
  gold integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- First try to get existing data
  RETURN QUERY
  SELECT 
    gd.user_id,
    gd.balance,
    gd.cards,
    gd.selected_team,
    gd.dragon_eggs,
    gd.account_level,
    gd.account_experience,
    gd.initialized,
    gd.marketplace_listings,
    gd.social_quests,
    gd.adventure_player_stats,
    gd.adventure_current_monster,
    gd.battle_state,
    gd.barracks_upgrades,
    gd.dragon_lair_upgrades,
    gd.active_workers,
    gd.wood,
    gd.stone,
    gd.iron,
    gd.gold
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;

  -- If no data found, call ensure_game_data_exists and retry
  IF NOT FOUND THEN
    SELECT public.ensure_game_data_exists(p_wallet_address) INTO v_user_id;
    
    -- Return the created data
    RETURN QUERY
    SELECT 
      gd.user_id,
      gd.balance,
      gd.cards,
      gd.selected_team,
      gd.dragon_eggs,
      gd.account_level,
      gd.account_experience,
      gd.initialized,
      gd.marketplace_listings,
      gd.social_quests,
      gd.adventure_player_stats,
      gd.adventure_current_monster,
      gd.battle_state,
      gd.barracks_upgrades,
      gd.dragon_lair_upgrades,
      gd.active_workers,
      gd.wood,
      gd.stone,
      gd.iron,
      gd.gold
    FROM public.game_data gd
    WHERE gd.wallet_address = p_wallet_address
    LIMIT 1;
  END IF;
END;
$$;