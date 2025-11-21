-- Fix admin_wipe_player to give starting balance of 100 ELL
CREATE OR REPLACE FUNCTION public.admin_wipe_player(
  p_target_wallet_address TEXT,
  p_admin_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can wipe player data';
  END IF;

  -- Reset game_data for the player with starting balance of 100 ELL
  UPDATE public.game_data
  SET
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
    stone_production_data = '{"isProducing": true, "isStorageFull": false}'::jsonb
  WHERE wallet_address = p_target_wallet_address;

  -- Delete player's card instances
  DELETE FROM public.card_instances WHERE wallet_address = p_target_wallet_address;

  -- Delete player's item instances
  DELETE FROM public.item_instances WHERE wallet_address = p_target_wallet_address;

  -- Delete player's medical bay entries
  DELETE FROM public.medical_bay WHERE wallet_address = p_target_wallet_address;

  -- Delete player's forge bay entries
  DELETE FROM public.forge_bay WHERE wallet_address = p_target_wallet_address;

  -- Delete player's marketplace listings
  DELETE FROM public.marketplace_listings WHERE seller_wallet_address = p_target_wallet_address;

  -- Delete player's soul donations
  DELETE FROM public.soul_donations WHERE wallet_address = p_target_wallet_address;

  RETURN TRUE;
END;
$$;