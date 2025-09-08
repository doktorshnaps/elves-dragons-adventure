-- Fix the initialization function to handle existing records properly
CREATE OR REPLACE FUNCTION public.initialize_game_data_by_wallet(p_wallet_address text)
RETURNS TABLE (
  user_id uuid,
  balance integer,
  cards jsonb,
  inventory jsonb,
  selected_team jsonb,
  dragon_eggs jsonb,
  account_level integer,
  account_experience integer
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  game_record RECORD;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Try to get existing game data
  SELECT * INTO game_record
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;

  IF game_record IS NOT NULL THEN
    -- Return existing data
    RETURN QUERY
    SELECT 
      game_record.user_id,
      game_record.balance,
      game_record.cards,
      game_record.inventory,
      game_record.selected_team,
      game_record.dragon_eggs,
      game_record.account_level,
      game_record.account_experience;
  ELSE
    -- No existing record found, return empty result
    -- Don't create new records here to avoid constraint violations
    RETURN;
  END IF;
END;
$$;