-- Remove inventory column references from get_game_data_by_wallet and create_game_data_by_wallet functions
-- since inventory column has been removed from game_data table

DROP FUNCTION IF EXISTS public.get_game_data_by_wallet(text);
DROP FUNCTION IF EXISTS public.create_game_data_by_wallet(text);

-- Recreate get_game_data_by_wallet function WITHOUT inventory field
CREATE OR REPLACE FUNCTION public.get_game_data_by_wallet(p_wallet_address text)
RETURNS TABLE(
  user_id uuid, 
  balance integer, 
  cards jsonb, 
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
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- First try to get existing data
  RETURN QUERY
  SELECT 
    gd.user_id,
    gd.balance,
    gd.cards,
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
    gd.dragon_lair_upgrades,
    gd.active_workers,
    gd.wood,
    gd.stone,
    gd.iron,
    gd.gold
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;

  -- If no data found, create it
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM public.create_game_data_by_wallet(p_wallet_address);
  END IF;
END;
$function$;

-- Recreate create_game_data_by_wallet function WITHOUT inventory field
CREATE OR REPLACE FUNCTION public.create_game_data_by_wallet(p_wallet_address text)
RETURNS TABLE(
  user_id uuid, 
  balance integer, 
  cards jsonb, 
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
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Generate new user ID
  v_user_id := gen_random_uuid();

  -- Create new game data record with default values (WITHOUT inventory)
  INSERT INTO public.game_data (
    user_id,
    wallet_address,
    balance,
    cards,
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
    100, -- Starting ELL balance
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
    150, -- Starting wood
    200, -- Starting stone  
    75,  -- Starting iron
    300  -- Starting gold
  );

  -- Return the created data
  RETURN QUERY
  SELECT 
    v_user_id,
    100,
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
    150,
    200,
    75,
    300;
END;
$function$;