-- Create a secure function to get game data for wallet without auth requirement
CREATE OR REPLACE FUNCTION public.get_game_data_by_wallet(p_wallet_address text)
RETURNS TABLE (
  user_id uuid,
  balance integer,
  cards jsonb,
  inventory jsonb,
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
  dragon_lair_upgrades jsonb
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  RETURN QUERY
  SELECT 
    gd.user_id,
    gd.balance,
    gd.cards,
    gd.inventory,
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
    gd.dragon_lair_upgrades
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_game_data_by_wallet(text) TO anon, authenticated;