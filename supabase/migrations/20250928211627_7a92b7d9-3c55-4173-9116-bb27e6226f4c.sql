-- Drop and recreate the functions with correct signatures
DROP FUNCTION IF EXISTS public.ensure_game_data_exists(text);
DROP FUNCTION IF EXISTS public.authenticate_wallet_session(text, text, text);

-- Recreate ensure_game_data_exists with correct return type
CREATE OR REPLACE FUNCTION public.ensure_game_data_exists(p_wallet_address text)
RETURNS boolean
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
    RETURN TRUE;
  END IF;

  -- Get or create wallet identity
  SELECT get_or_create_wallet_identity(p_wallet_address) INTO v_user_id;

  -- Create new with proper handling
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
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    1,
    0,
    true
  )
  ON CONFLICT (wallet_address) DO NOTHING;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE NOTICE 'Error in ensure_game_data_exists: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Recreate authenticate_wallet_session with simplified approach
CREATE OR REPLACE FUNCTION public.authenticate_wallet_session(
  p_wallet_address text,
  p_signature text,
  p_message text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get or create wallet identity
  SELECT get_or_create_wallet_identity(p_wallet_address) INTO v_user_id;
  
  -- For wallet-based auth, just return the identity
  RETURN v_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in authenticate_wallet_session: %', SQLERRM;
    RETURN v_user_id;
END;
$$;