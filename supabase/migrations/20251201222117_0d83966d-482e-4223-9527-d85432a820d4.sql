-- Fix admin_wipe_player to also reset assigned workers
-- This fixes the issue where workers remain assigned after player wipe

-- Drop existing function first
DROP FUNCTION IF EXISTS public.admin_wipe_player(text, text);

-- Recreate with proper worker cleanup
CREATE FUNCTION public.admin_wipe_player(
  p_admin_wallet_address TEXT,
  p_target_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check admin privileges
  SELECT public.is_admin_or_super_wallet(p_admin_wallet_address) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can wipe player data';
  END IF;

  -- Delete card instances (including workers with type='workers')
  DELETE FROM public.card_instances 
  WHERE wallet_address = p_target_wallet_address;

  -- Delete item instances
  DELETE FROM public.item_instances 
  WHERE wallet_address = p_target_wallet_address;

  -- Delete medical bay entries
  DELETE FROM public.medical_bay 
  WHERE wallet_address = p_target_wallet_address;

  -- Delete forge bay entries
  DELETE FROM public.forge_bay 
  WHERE wallet_address = p_target_wallet_address;

  -- Delete marketplace listings
  DELETE FROM public.marketplace_listings 
  WHERE seller_wallet_address = p_target_wallet_address;

  -- Delete soul donations
  DELETE FROM public.soul_donations 
  WHERE wallet_address = p_target_wallet_address;

  -- Delete quest progress
  DELETE FROM public.user_quest_progress 
  WHERE wallet_address = p_target_wallet_address;

  -- Reset game data with starting balance of 100 ELL and empty active_workers
  UPDATE public.game_data
  SET 
    balance = 100,
    wood = 0,
    stone = 0,
    iron = 0,
    gold = 0,
    cards = '[]'::jsonb,
    dragon_eggs = '[]'::jsonb,
    selected_team = '[]'::jsonb,
    battle_state = NULL,
    marketplace_listings = '[]'::jsonb,
    social_quests = '[]'::jsonb,
    adventure_player_stats = NULL,
    adventure_current_monster = NULL,
    barracks_upgrades = '[]'::jsonb,
    dragon_lair_upgrades = '[]'::jsonb,
    account_level = 1,
    account_experience = 0,
    active_workers = '[]'::jsonb,
    building_levels = jsonb_build_object(
      'mainHall', 1,
      'barracks', 0,
      'dragonLair', 0,
      'medicalBay', 0,
      'forge', 0,
      'woodStorage', 0,
      'stoneStorage', 0
    ),
    active_building_upgrades = '[]'::jsonb,
    max_wood = 100,
    max_stone = 100,
    max_iron = 0,
    wood_last_collection_time = NULL,
    stone_last_collection_time = NULL,
    wood_production_data = NULL,
    stone_production_data = NULL,
    updated_at = NOW()
  WHERE wallet_address = p_target_wallet_address;

  RETURN TRUE;
END;
$$;