-- Fix the RPC function to properly handle user_id for new records
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
  p_building_levels jsonb DEFAULT NULL,
  p_active_building_upgrades jsonb DEFAULT NULL,
  p_wood integer DEFAULT NULL,
  p_stone integer DEFAULT NULL,
  p_iron integer DEFAULT NULL,
  p_gold integer DEFAULT NULL,
  p_max_wood integer DEFAULT NULL,
  p_max_stone integer DEFAULT NULL,
  p_max_iron integer DEFAULT NULL,
  p_wood_last_collection_time bigint DEFAULT NULL,
  p_stone_last_collection_time bigint DEFAULT NULL,
  p_wood_production_data jsonb DEFAULT NULL,
  p_stone_production_data jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_record RECORD;
  v_user_id uuid;
  update_count INTEGER;
BEGIN
  -- Check if wallet exists in whitelist and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.whitelist 
    WHERE wallet_address = p_wallet_address 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Wallet not whitelisted or inactive: %', p_wallet_address;
  END IF;

  -- Get existing user record
  SELECT * INTO user_record
  FROM public.game_data
  WHERE wallet_address = p_wallet_address;

  IF user_record IS NULL THEN
    -- Generate a new user_id for the new record
    v_user_id := gen_random_uuid();
    
    -- Insert new record with proper user_id
    INSERT INTO public.game_data (
      user_id,
      wallet_address,
      balance,
      cards,
      inventory,
      selected_team,
      dragon_eggs,
      account_level,
      account_experience,
      initialized,
      marketplace_listings,
      social_quests,
      adventure_player_stats,
      adventure_current_monster,
      battle_state,
      barracks_upgrades,
      dragon_lair_upgrades,
      active_workers,
      building_levels,
      active_building_upgrades,
      wood,
      stone,
      iron,
      gold,
      max_wood,
      max_stone,
      max_iron,
      wood_last_collection_time,
      stone_last_collection_time,
      wood_production_data,
      stone_production_data
    ) VALUES (
      v_user_id,
      p_wallet_address,
      COALESCE(p_balance, 1000),
      COALESCE(p_cards, '[]'::jsonb),
      COALESCE(p_inventory, '[]'::jsonb),
      COALESCE(p_selected_team, '[]'::jsonb),
      COALESCE(p_dragon_eggs, '[]'::jsonb),
      COALESCE(p_account_level, 1),
      COALESCE(p_account_experience, 0),
      COALESCE(p_initialized, false),
      COALESCE(p_marketplace_listings, '[]'::jsonb),
      COALESCE(p_social_quests, '[]'::jsonb),
      p_adventure_player_stats,
      p_adventure_current_monster,
      p_battle_state,
      COALESCE(p_barracks_upgrades, '[]'::jsonb),
      COALESCE(p_dragon_lair_upgrades, '[]'::jsonb),
      COALESCE(p_active_workers, '[]'::jsonb),
      COALESCE(p_building_levels, '{"quarry": 0, "medical": 0, "sawmill": 0, "storage": 0, "barracks": 0, "workshop": 0, "main_hall": 0, "dragon_lair": 0}'::jsonb),
      COALESCE(p_active_building_upgrades, '[]'::jsonb),
      COALESCE(p_wood, 0),
      COALESCE(p_stone, 0),
      COALESCE(p_iron, 0),
      COALESCE(p_gold, 0),
      COALESCE(p_max_wood, 100),
      COALESCE(p_max_stone, 100),
      COALESCE(p_max_iron, 100),
      COALESCE(p_wood_last_collection_time, EXTRACT(epoch FROM now()) * 1000),
      COALESCE(p_stone_last_collection_time, EXTRACT(epoch FROM now()) * 1000),
      COALESCE(p_wood_production_data, '{"isProducing": true, "isStorageFull": false}'::jsonb),
      COALESCE(p_stone_production_data, '{"isProducing": true, "isStorageFull": false}'::jsonb)
    );
    RETURN true;
  ELSE
    -- Update existing record with only non-null parameters
    UPDATE public.game_data SET
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
      active_building_upgrades = COALESCE(p_active_building_upgrades, active_building_upgrades),
      wood = COALESCE(p_wood, wood),
      stone = COALESCE(p_stone, stone),
      iron = COALESCE(p_iron, iron),
      gold = COALESCE(p_gold, gold),
      max_wood = COALESCE(p_max_wood, max_wood),
      max_stone = COALESCE(p_max_stone, max_stone),
      max_iron = COALESCE(p_max_iron, max_iron),
      wood_last_collection_time = COALESCE(p_wood_last_collection_time, wood_last_collection_time),
      stone_last_collection_time = COALESCE(p_stone_last_collection_time, stone_last_collection_time),
      wood_production_data = COALESCE(p_wood_production_data, wood_production_data),
      stone_production_data = COALESCE(p_stone_production_data, stone_production_data),
      updated_at = now()
    WHERE wallet_address = p_wallet_address;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RETURN update_count > 0;
  END IF;
END;
$$;