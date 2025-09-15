-- Create function to initialize game data for a wallet
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
  dragon_lair_upgrades jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_record RECORD;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Check if record already exists
  SELECT * INTO new_record
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;

  IF new_record IS NOT NULL THEN
    -- Return existing record
    RETURN QUERY
    SELECT 
      new_record.user_id,
      new_record.balance,
      new_record.cards,
      new_record.inventory,
      new_record.selected_team,
      new_record.dragon_eggs,
      new_record.account_level,
      new_record.account_experience,
      new_record.initialized,
      new_record.marketplace_listings,
      new_record.social_quests,
      new_record.adventure_player_stats,
      new_record.adventure_current_monster,
      new_record.battle_state,
      new_record.barracks_upgrades,
      new_record.dragon_lair_upgrades;
  ELSE
    -- Create new record with default values
    INSERT INTO public.game_data (
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
      dragon_lair_upgrades
    ) VALUES (
      p_wallet_address,
      0, -- default balance
      '[]'::jsonb, -- empty cards array
      '[]'::jsonb, -- empty inventory
      '[]'::jsonb, -- empty selected team
      '[]'::jsonb, -- empty dragon eggs
      1, -- starting level
      0, -- starting experience
      false, -- not initialized
      '[]'::jsonb, -- empty marketplace listings
      '[]'::jsonb, -- empty social quests
      NULL, -- no adventure stats
      NULL, -- no current monster
      NULL, -- no battle state
      '[]'::jsonb, -- empty barracks upgrades
      '[]'::jsonb -- empty dragon lair upgrades
    ) RETURNING * INTO new_record;

    -- Return the new record
    RETURN QUERY
    SELECT 
      new_record.user_id,
      new_record.balance,
      new_record.cards,
      new_record.inventory,
      new_record.selected_team,
      new_record.dragon_eggs,
      new_record.account_level,
      new_record.account_experience,
      new_record.initialized,
      new_record.marketplace_listings,
      new_record.social_quests,
      new_record.adventure_player_stats,
      new_record.adventure_current_monster,
      new_record.battle_state,
      new_record.barracks_upgrades,
      new_record.dragon_lair_upgrades;
  END IF;
END;
$$;

-- Create RLS policy for creating game_data records
DROP POLICY IF EXISTS "allow_wallet_create_game_data" ON public.game_data;
CREATE POLICY "allow_wallet_create_game_data" 
ON public.game_data 
FOR INSERT 
WITH CHECK (true); -- Allow any wallet to create a record for themselves

-- Update the get_game_data_by_wallet function to auto-create if not exists
CREATE OR REPLACE FUNCTION public.get_game_data_by_wallet(p_wallet_address text)
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
  dragon_lair_upgrades jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    gd.inventory,
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
    gd.dragon_lair_upgrades
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;

  -- If no data found, create it
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM public.create_game_data_by_wallet(p_wallet_address);
  END IF;
END;
$$;