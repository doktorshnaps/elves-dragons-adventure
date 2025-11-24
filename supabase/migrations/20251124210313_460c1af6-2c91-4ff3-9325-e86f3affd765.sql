-- Add building_levels and active_building_upgrades to get_game_data_by_wallet function
DROP FUNCTION IF EXISTS public.get_game_data_by_wallet(text);

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
  gold integer,
  building_levels jsonb,
  active_building_upgrades jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Check if data exists
  SELECT EXISTS(
    SELECT 1 FROM public.game_data WHERE wallet_address = p_wallet_address
  ) INTO v_exists;

  -- If no data exists, create it
  IF NOT v_exists THEN
    SELECT public.ensure_game_data_exists(p_wallet_address) INTO v_user_id;
  END IF;

  -- Return the data including building_levels and active_building_upgrades
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
    gd.gold,
    gd.building_levels,
    gd.active_building_upgrades
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;
END;
$$;