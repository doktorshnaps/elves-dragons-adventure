-- Create function to initialize or get game data by wallet address without auth requirement
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
  v_user_id uuid;
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
    -- Create new game data record with default values
    v_user_id := gen_random_uuid();
    
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
      initialized
    ) VALUES (
      v_user_id,
      p_wallet_address,
      100, -- default starting balance
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      1,
      0,
      true
    );

    -- Return the newly created data
    RETURN QUERY
    SELECT 
      v_user_id,
      100,
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb,
      1,
      0;
  END IF;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.initialize_game_data_by_wallet(text) TO anon, authenticated;