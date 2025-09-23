-- Create or replace RPC to update game data by wallet (includes building_levels)
CREATE OR REPLACE FUNCTION public.update_game_data_by_wallet(
  p_wallet_address text,
  p_balance integer DEFAULT NULL,
  p_cards jsonb DEFAULT NULL,
  p_inventory jsonb DEFAULT NULL,
  p_selected_team jsonb DEFAULT NULL,
  p_dragon_eggs jsonb DEFAULT NULL,
  p_account_level integer DEFAULT NULL,
  p_account_experience integer DEFAULT NULL,
  p_initialized boolean DEFAULT NULL,
  p_marketplace_listings jsonb DEFAULT NULL,
  p_social_quests jsonb DEFAULT NULL,
  p_adventure_player_stats jsonb DEFAULT NULL,
  p_adventure_current_monster jsonb DEFAULT NULL,
  p_battle_state jsonb DEFAULT NULL,
  p_barracks_upgrades jsonb DEFAULT NULL,
  p_dragon_lair_upgrades jsonb DEFAULT NULL,
  p_active_workers jsonb DEFAULT NULL,
  p_building_levels jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.game_data
  SET
    balance = COALESCE(p_balance, balance),
    cards = COALESCE(p_cards, cards),
    inventory = COALESCE(p_inventory, inventory),
    selected_team = COALESCE(p_selected_team, selected_team),
    dragon_eggs = COALESCE(p_dragon_eggs, dragon_eggs),
    account_level = COALESCE(p_account_level, account_level),
    account_experience = COALESCE(p_account_experience, account_experience),
    initialized = COALESCE(p_initialized, initialized),
    marketplace_listings = COALESCE(p_marketplace_listings, marketplace_listings),
    social_quests = COALESCE(p_social_quests, social_quests),
    adventure_player_stats = COALESCE(p_adventure_player_stats, adventure_player_stats),
    adventure_current_monster = COALESCE(p_adventure_current_monster, adventure_current_monster),
    battle_state = COALESCE(p_battle_state, battle_state),
    barracks_upgrades = COALESCE(p_barracks_upgrades, barracks_upgrades),
    dragon_lair_upgrades = COALESCE(p_dragon_lair_upgrades, dragon_lair_upgrades),
    active_workers = COALESCE(p_active_workers, active_workers),
    building_levels = COALESCE(p_building_levels, building_levels),
    updated_at = now()
  WHERE wallet_address = p_wallet_address;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;