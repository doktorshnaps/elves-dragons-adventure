-- Ensure the ensure_game_data_exists function creates entries with 0 balance
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
  
  -- Create new game data with 0 balance (no starter bonuses)
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
    gold
  ) VALUES (
    v_user_id,
    p_wallet_address,
    0, -- Start with 0 balance - no free ELL
    '[]'::jsonb, -- Start with empty cards - no free starter packs
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
    0,
    0,
    0,
    0
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