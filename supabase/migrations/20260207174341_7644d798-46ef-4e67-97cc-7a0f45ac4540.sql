
-- Drop old RLS policies that use auth.uid() (won't work with wallet-based auth)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Allow anyone to read profiles (display names are public info)
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

-- Disable direct insert/update from client - use RPC instead for security
CREATE POLICY "profiles_no_direct_insert" ON public.profiles FOR INSERT WITH CHECK (false);
CREATE POLICY "profiles_no_direct_update" ON public.profiles FOR UPDATE USING (false);

-- RPC to upsert display name (wallet-based auth, validates input)
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

  -- Upsert profile
  INSERT INTO profiles (user_id, wallet_address, display_name, updated_at)
  VALUES (gen_random_uuid()::text, p_wallet_address, v_clean_name, now())
  ON CONFLICT (wallet_address) 
  DO UPDATE SET display_name = v_clean_name, updated_at = now();

  RETURN json_build_object('success', true, 'display_name', v_clean_name);
END;
$$;

-- RPC to get display names for a list of wallet addresses (batch)
CREATE OR REPLACE FUNCTION public.get_display_names(p_wallets text[])
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_object_agg(wallet_address, display_name)
  INTO v_result
  FROM profiles
  WHERE wallet_address = ANY(p_wallets)
  AND display_name IS NOT NULL;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- Add unique constraint on wallet_address if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_wallet_address_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_wallet_address_key UNIQUE (wallet_address);
  END IF;
END $$;
