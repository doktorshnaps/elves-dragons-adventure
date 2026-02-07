
-- Drop the foreign key constraint that requires user_id to exist in auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Recreate the upsert function without relying on auth.users
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
  v_existing_user_id uuid;
BEGIN
  IF p_wallet_address IS NULL OR length(p_wallet_address) < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid wallet address');
  END IF;

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

  -- Check if profile already exists
  SELECT user_id INTO v_existing_user_id FROM profiles WHERE wallet_address = p_wallet_address;

  IF v_existing_user_id IS NOT NULL THEN
    -- Update existing profile
    UPDATE profiles 
    SET display_name = v_clean_name, updated_at = now()
    WHERE wallet_address = p_wallet_address;
  ELSE
    -- Insert new profile with a generated UUID (no FK to auth.users)
    INSERT INTO profiles (user_id, wallet_address, display_name, updated_at)
    VALUES (gen_random_uuid(), p_wallet_address, v_clean_name, now());
  END IF;

  RETURN json_build_object('success', true, 'display_name', v_clean_name);
END;
$$;
