-- Create function to initialize game_data record for new wallets
CREATE OR REPLACE FUNCTION public.ensure_game_data_exists(p_wallet_address text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  existing_record RECORD;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Check if record already exists
  SELECT * INTO existing_record
  FROM public.game_data 
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF existing_record IS NOT NULL THEN
    -- Record exists, return existing user_id
    RETURN existing_record.user_id;
  ELSE
    -- Create new record with default values
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
      initialized,
      marketplace_listings,
      social_quests,
      barracks_upgrades,
      dragon_lair_upgrades
    ) VALUES (
      v_user_id,
      p_wallet_address,
      0, -- Start with 0 balance
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
      '[]'::jsonb
    );

    RETURN v_user_id;
  END IF;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.ensure_game_data_exists(text) TO anon, authenticated;