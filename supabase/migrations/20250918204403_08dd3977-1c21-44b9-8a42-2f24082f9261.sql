-- Extend update_game_data_by_wallet to support active_workers and add a dedicated RPC for updating active_workers securely

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
  p_active_workers jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  update_data jsonb := '{}';
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  IF p_balance IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('balance', p_balance);
  END IF;
  IF p_cards IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('cards', p_cards);
  END IF;
  IF p_inventory IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('inventory', p_inventory);
  END IF;
  IF p_selected_team IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('selected_team', p_selected_team);
  END IF;
  IF p_dragon_eggs IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('dragon_eggs', p_dragon_eggs);
  END IF;
  IF p_account_level IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('account_level', p_account_level);
  END IF;
  IF p_account_experience IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('account_experience', p_account_experience);
  END IF;
  IF p_initialized IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('initialized', p_initialized);
  END IF;
  IF p_marketplace_listings IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('marketplace_listings', p_marketplace_listings);
  END IF;
  IF p_social_quests IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('social_quests', p_social_quests);
  END IF;
  IF p_adventure_player_stats IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('adventure_player_stats', p_adventure_player_stats);
  END IF;
  IF p_adventure_current_monster IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('adventure_current_monster', p_adventure_current_monster);
  END IF;
  IF p_battle_state IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('battle_state', p_battle_state);
  END IF;
  IF p_barracks_upgrades IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('barracks_upgrades', p_barracks_upgrades);
  END IF;
  IF p_dragon_lair_upgrades IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('dragon_lair_upgrades', p_dragon_lair_upgrades);
  END IF;
  IF p_active_workers IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('active_workers', p_active_workers);
  END IF;

  UPDATE public.game_data 
  SET 
    balance = COALESCE((update_data->>'balance')::integer, balance),
    cards = COALESCE((update_data->'cards'), cards),
    inventory = COALESCE((update_data->'inventory'), inventory),
    selected_team = COALESCE((update_data->'selected_team'), selected_team),
    dragon_eggs = COALESCE((update_data->'dragon_eggs'), dragon_eggs),
    account_level = COALESCE((update_data->>'account_level')::integer, account_level),
    account_experience = COALESCE((update_data->>'account_experience')::integer, account_experience),
    initialized = COALESCE((update_data->>'initialized')::boolean, initialized),
    marketplace_listings = COALESCE((update_data->'marketplace_listings'), marketplace_listings),
    social_quests = COALESCE((update_data->'social_quests'), social_quests),
    adventure_player_stats = COALESCE((update_data->'adventure_player_stats'), adventure_player_stats),
    adventure_current_monster = COALESCE((update_data->'adventure_current_monster'), adventure_current_monster),
    battle_state = COALESCE((update_data->'battle_state'), battle_state),
    barracks_upgrades = COALESCE((update_data->'barracks_upgrades'), barracks_upgrades),
    dragon_lair_upgrades = COALESCE((update_data->'dragon_lair_upgrades'), dragon_lair_upgrades),
    active_workers = COALESCE((update_data->'active_workers'), active_workers),
    updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN FOUND;
END;
$$;

-- Dedicated RPC to update active_workers if needed separately
CREATE OR REPLACE FUNCTION public.update_active_workers_by_wallet(
  p_wallet_address text,
  p_active_workers jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  UPDATE public.game_data
  SET active_workers = COALESCE(p_active_workers, '[]'::jsonb),
      updated_at = now()
  WHERE wallet_address = p_wallet_address;
  RETURN FOUND;
END;
$$;