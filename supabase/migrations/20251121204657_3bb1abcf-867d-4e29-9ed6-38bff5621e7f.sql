-- Fix admin_wipe_player to use UPSERT instead of UPDATE
CREATE OR REPLACE FUNCTION public.admin_wipe_player(
  p_target_wallet_address TEXT,
  p_admin_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can wipe player data';
  END IF;

  -- Get or create user_id for the wallet
  SELECT id INTO v_user_id FROM public.wallet_identities WHERE wallet_address = p_target_wallet_address;
  
  IF v_user_id IS NULL THEN
    INSERT INTO public.wallet_identities (wallet_address)
    VALUES (p_target_wallet_address)
    RETURNING id INTO v_user_id;
  END IF;

  -- Delete existing data first
  DELETE FROM public.card_instances WHERE wallet_address = p_target_wallet_address;
  DELETE FROM public.item_instances WHERE wallet_address = p_target_wallet_address;
  DELETE FROM public.medical_bay WHERE wallet_address = p_target_wallet_address;
  DELETE FROM public.forge_bay WHERE wallet_address = p_target_wallet_address;
  DELETE FROM public.marketplace_listings WHERE seller_wallet_address = p_target_wallet_address;
  DELETE FROM public.soul_donations WHERE wallet_address = p_target_wallet_address;

  -- UPSERT game_data with starting balance of 100 ELL
  INSERT INTO public.game_data (
    user_id,
    wallet_address,
    balance,
    gold,
    wood,
    stone,
    iron,
    cards,
    dragon_eggs,
    selected_team,
    battle_state,
    social_quests,
    adventure_player_stats,
    adventure_current_monster,
    barracks_upgrades,
    dragon_lair_upgrades,
    account_level,
    account_experience,
    active_workers,
    marketplace_listings,
    active_building_upgrades,
    building_levels,
    max_wood,
    max_stone,
    max_iron,
    wood_last_collection_time,
    stone_last_collection_time,
    wood_production_data,
    stone_production_data,
    initialized
  )
  VALUES (
    v_user_id,
    p_target_wallet_address,
    100,
    0,
    0,
    0,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    NULL,
    '[]'::jsonb,
    NULL,
    NULL,
    '[]'::jsonb,
    '[]'::jsonb,
    1,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{"quarry": 0, "medical": 0, "sawmill": 0, "storage": 0, "barracks": 0, "workshop": 0, "main_hall": 0, "dragon_lair": 0, "forge": 0}'::jsonb,
    0,
    0,
    0,
    EXTRACT(epoch FROM now()) * 1000,
    EXTRACT(epoch FROM now()) * 1000,
    '{"isProducing": true, "isStorageFull": false}'::jsonb,
    '{"isProducing": true, "isStorageFull": false}'::jsonb,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = 100,
    gold = 0,
    wood = 0,
    stone = 0,
    iron = 0,
    cards = '[]'::jsonb,
    dragon_eggs = '[]'::jsonb,
    selected_team = '[]'::jsonb,
    battle_state = NULL,
    social_quests = '[]'::jsonb,
    adventure_player_stats = NULL,
    adventure_current_monster = NULL,
    barracks_upgrades = '[]'::jsonb,
    dragon_lair_upgrades = '[]'::jsonb,
    account_level = 1,
    account_experience = 0,
    active_workers = '[]'::jsonb,
    marketplace_listings = '[]'::jsonb,
    active_building_upgrades = '[]'::jsonb,
    building_levels = '{"quarry": 0, "medical": 0, "sawmill": 0, "storage": 0, "barracks": 0, "workshop": 0, "main_hall": 0, "dragon_lair": 0, "forge": 0}'::jsonb,
    max_wood = 0,
    max_stone = 0,
    max_iron = 0,
    wood_last_collection_time = EXTRACT(epoch FROM now()) * 1000,
    stone_last_collection_time = EXTRACT(epoch FROM now()) * 1000,
    wood_production_data = '{"isProducing": true, "isStorageFull": false}'::jsonb,
    stone_production_data = '{"isProducing": true, "isStorageFull": false}'::jsonb,
    initialized = true,
    wallet_address = p_target_wallet_address,
    updated_at = now();

  RETURN TRUE;
END;
$$;