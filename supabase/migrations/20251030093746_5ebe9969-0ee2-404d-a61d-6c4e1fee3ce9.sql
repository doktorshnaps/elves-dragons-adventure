-- Remove inventory column references from get_game_data_by_wallet_full function
-- since inventory column has been removed from game_data table

DROP FUNCTION IF EXISTS public.get_game_data_by_wallet_full(text);

CREATE OR REPLACE FUNCTION public.get_game_data_by_wallet_full(p_wallet_address text)
RETURNS TABLE(
  user_id uuid,
  balance integer,
  cards jsonb,
  marketplace_listings jsonb,
  social_quests jsonb,
  adventure_player_stats jsonb,
  adventure_current_monster jsonb,
  dragon_eggs jsonb,
  battle_state jsonb,
  selected_team jsonb,
  barracks_upgrades jsonb,
  dragon_lair_upgrades jsonb,
  account_level integer,
  account_experience integer,
  active_workers jsonb,
  wood integer,
  stone integer,
  iron integer,
  gold integer,
  building_levels jsonb,
  max_wood integer,
  max_stone integer,
  max_iron integer,
  active_building_upgrades jsonb,
  wood_last_collection_time bigint,
  stone_last_collection_time bigint,
  wood_production_data jsonb,
  stone_production_data jsonb,
  wallet_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout = '30s'
AS $$
BEGIN
  RAISE LOG 'GET_GAME_DATA_FULL_DEBUG: called for wallet=%', p_wallet_address;
  
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  
  -- Return game data with limits on large arrays
  RETURN QUERY 
  SELECT 
    gd.user_id,
    gd.balance,
    -- Limit cards to first 500 to prevent timeout
    CASE 
      WHEN jsonb_array_length(COALESCE(gd.cards, '[]'::jsonb)) > 500 
      THEN (SELECT jsonb_agg(elem) FROM jsonb_array_elements(gd.cards) WITH ORDINALITY AS t(elem, ord) WHERE t.ord <= 500)
      ELSE gd.cards
    END as cards,
    gd.marketplace_listings,
    gd.social_quests,
    gd.adventure_player_stats,
    gd.adventure_current_monster,
    gd.dragon_eggs,
    gd.battle_state,
    gd.selected_team,
    gd.barracks_upgrades,
    gd.dragon_lair_upgrades,
    gd.account_level,
    gd.account_experience,
    gd.active_workers,
    gd.wood,
    gd.stone,
    gd.iron,
    gd.gold,
    gd.building_levels,
    gd.max_wood,
    gd.max_stone,
    gd.max_iron,
    gd.active_building_upgrades,
    gd.wood_last_collection_time,
    gd.stone_last_collection_time,
    gd.wood_production_data,
    gd.stone_production_data,
    gd.wallet_address
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'GET_GAME_DATA_FULL_ERROR: wallet=%, error=%', p_wallet_address, SQLERRM;
    RAISE;
END;
$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_data_wallet 
ON public.game_data (wallet_address);