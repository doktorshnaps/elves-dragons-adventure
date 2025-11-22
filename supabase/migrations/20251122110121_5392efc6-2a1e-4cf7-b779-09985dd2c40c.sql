-- Fix ensure_game_data_exists to give 100 ELL to new players
DROP FUNCTION IF EXISTS public.ensure_game_data_exists(text);

CREATE OR REPLACE FUNCTION public.ensure_game_data_exists(p_wallet_address text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  existing_record RECORD;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Try to load existing
  SELECT * INTO existing_record
  FROM public.game_data 
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF existing_record IS NOT NULL THEN
    RETURN existing_record.user_id;
  END IF;

  -- Get or create wallet identity
  SELECT get_or_create_wallet_identity(p_wallet_address) INTO v_user_id;
  
  -- Create new game data with 100 ELL starting balance
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
    barracks_upgrades,
    dragon_lair_upgrades,
    wood,
    stone,
    iron,
    gold,
    active_workers,
    building_levels
  ) VALUES (
    v_user_id,
    p_wallet_address,
    100, -- Starting 100 ELL for new players
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    1,
    0,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    0, -- No starting wood
    0, -- No starting stone  
    0, -- No starting iron
    0, -- No starting gold
    '[]'::jsonb,
    '{"quarry": 0, "medical": 0, "sawmill": 0, "storage": 0, "barracks": 0, "workshop": 0, "main_hall": 0, "dragon_lair": 0, "forge": 0}'::jsonb
  )
  ON CONFLICT (wallet_address) DO NOTHING;

  -- Return the created or existing id
  IF NOT FOUND THEN
    SELECT user_id INTO v_user_id FROM public.game_data WHERE wallet_address = p_wallet_address LIMIT 1;
  END IF;

  RETURN v_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail completely
    RAISE NOTICE 'Error in ensure_game_data_exists: %', SQLERRM;
    -- Try to return existing user_id if possible
    SELECT user_id INTO v_user_id FROM public.game_data WHERE wallet_address = p_wallet_address LIMIT 1;
    RETURN v_user_id;
END;
$$;