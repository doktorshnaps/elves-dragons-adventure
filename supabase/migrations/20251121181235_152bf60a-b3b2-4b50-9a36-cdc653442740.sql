-- Fix create_game_data_by_wallet to only give 100 ELL to new players, no resources
DROP FUNCTION IF EXISTS public.create_game_data_by_wallet(text);

CREATE OR REPLACE FUNCTION public.create_game_data_by_wallet(p_wallet_address text)
RETURNS TABLE(
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
  dragon_lair_upgrades jsonb, 
  active_workers jsonb,
  wood integer,
  stone integer,
  iron integer,
  gold integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Get or create wallet identity
  SELECT public.get_or_create_wallet_identity(p_wallet_address) INTO v_user_id;

  -- Create new game data record with only 100 ELL, no resources
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
    wood,
    stone,
    iron,
    gold
  ) VALUES (
    v_user_id,
    p_wallet_address,
    100, -- Starting 100 ELL only
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    1,
    0,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    0, -- No starting wood
    0, -- No starting stone  
    0, -- No starting iron
    0  -- No starting gold
  );

  -- Return the created data
  RETURN QUERY
  SELECT 
    v_user_id,
    100,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    1,
    0,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    NULL::jsonb,
    NULL::jsonb,
    NULL::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    0,
    0,
    0,
    0;
END;
$$;