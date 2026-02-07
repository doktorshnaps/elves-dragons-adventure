
CREATE OR REPLACE FUNCTION public.upsert_display_name(
  p_wallet_address text,
  p_display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_name text;
  v_user_id uuid;
BEGIN
  -- Validate wallet address
  IF p_wallet_address IS NULL OR length(p_wallet_address) < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid wallet address');
  END IF;

  -- Clean and validate display name
  v_clean_name := trim(p_display_name);
  
  IF v_clean_name IS NULL OR length(v_clean_name) < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Name must be at least 2 characters');
  END IF;
  
  IF length(v_clean_name) > 20 THEN
    RETURN json_build_object('success', false, 'error', 'Name must be 20 characters or less');
  END IF;

  -- Check for uniqueness (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE lower(display_name) = lower(v_clean_name) 
    AND wallet_address != p_wallet_address
  ) THEN
    RETURN json_build_object('success', false, 'error', 'This name is already taken');
  END IF;

  -- Get existing user_id or generate a proper UUID
  SELECT id::uuid INTO v_user_id FROM profiles WHERE wallet_address = p_wallet_address;
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
  END IF;

  -- Upsert profile with proper UUID for user_id
  INSERT INTO profiles (user_id, wallet_address, display_name, updated_at)
  VALUES (v_user_id::text, p_wallet_address, v_clean_name, now())
  ON CONFLICT (wallet_address) 
  DO UPDATE SET display_name = v_clean_name, updated_at = now();

  RETURN json_build_object('success', true, 'display_name', v_clean_name);
END;
$$;
