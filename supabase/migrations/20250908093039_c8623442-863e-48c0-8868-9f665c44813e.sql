-- Create a secure authentication system for wallet-based users

-- First, create a function to authenticate wallet sessions
CREATE OR REPLACE FUNCTION public.authenticate_wallet_session(p_wallet_address text, p_signature text, p_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_identity_id uuid;
BEGIN
  -- Get or create wallet identity
  SELECT get_or_create_wallet_identity(p_wallet_address) INTO v_identity_id;
  
  -- For now, we'll create/get a user based on wallet address
  -- In production, you'd verify the signature here
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE raw_user_meta_data->>'wallet_address' = p_wallet_address;
  
  IF v_user_id IS NULL THEN
    -- Create a new user for this wallet
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_wallet_address || '@wallet.local',
      crypt('wallet-auth', gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('wallet_address', p_wallet_address),
      false,
      '',
      '',
      '',
      ''
    ) RETURNING id INTO v_user_id;
  END IF;
  
  -- Update profiles table to link user_id with wallet_address
  INSERT INTO public.profiles (user_id, wallet_address)
  VALUES (v_user_id, p_wallet_address)
  ON CONFLICT (user_id) 
  DO UPDATE SET wallet_address = EXCLUDED.wallet_address, updated_at = now();
  
  -- Update game_data to link user_id with wallet_address
  UPDATE public.game_data 
  SET user_id = v_user_id 
  WHERE wallet_address = p_wallet_address AND user_id IS NULL;
  
  RETURN v_user_id;
END;
$$;

-- Create function to get current user's wallet address
CREATE OR REPLACE FUNCTION public.get_current_user_wallet()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT wallet_address 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Update RLS policies to use proper authentication

-- Update game_data policies
DROP POLICY IF EXISTS "Wallet owners can view their own game data" ON public.game_data;
DROP POLICY IF EXISTS "Wallet owners can update their own game data" ON public.game_data;
DROP POLICY IF EXISTS "Wallet owners can insert their own game data" ON public.game_data;

CREATE POLICY "Users can view their own game data"
ON public.game_data
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
);

CREATE POLICY "Users can update their own game data"
ON public.game_data
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
);

CREATE POLICY "Users can insert their own game data"
ON public.game_data
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
);

-- Update profiles policies
DROP POLICY IF EXISTS "Wallet owners can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Wallet owners can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Wallet owners can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update card_instances policies
DROP POLICY IF EXISTS "Wallet owners can view their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Wallet owners can update their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Wallet owners can insert their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Wallet owners can delete their own card instances" ON public.card_instances;

CREATE POLICY "Users can view their own card instances"
ON public.card_instances
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
);

CREATE POLICY "Users can update their own card instances"
ON public.card_instances
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
);

CREATE POLICY "Users can insert their own card instances"
ON public.card_instances
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
);

CREATE POLICY "Users can delete their own card instances"
ON public.card_instances
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR wallet_address = get_current_user_wallet())
);

-- Update user_nft_cards policies
DROP POLICY IF EXISTS "Users can view their own NFT cards" ON public.user_nft_cards;
DROP POLICY IF EXISTS "Users can insert their own NFT cards" ON public.user_nft_cards;
DROP POLICY IF EXISTS "Users can update their own NFT cards" ON public.user_nft_cards;
DROP POLICY IF EXISTS "Users can delete their own NFT cards" ON public.user_nft_cards;

CREATE POLICY "Users can view their own NFT cards"
ON public.user_nft_cards
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);

CREATE POLICY "Users can insert their own NFT cards"
ON public.user_nft_cards
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);

CREATE POLICY "Users can update their own NFT cards"
ON public.user_nft_cards
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);

CREATE POLICY "Users can delete their own NFT cards"
ON public.user_nft_cards
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);

-- Update wallet_identities policies  
DROP POLICY IF EXISTS "Wallet owners can view wallet identities" ON public.wallet_identities;
DROP POLICY IF EXISTS "Wallet owners can insert wallet identities" ON public.wallet_identities;
DROP POLICY IF EXISTS "Wallet owners can update wallet identities" ON public.wallet_identities;

CREATE POLICY "Users can view their own wallet identities"
ON public.wallet_identities
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);

CREATE POLICY "Users can insert their own wallet identities"
ON public.wallet_identities
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);

CREATE POLICY "Users can update their own wallet identities"
ON public.wallet_identities
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);

-- Update marketplace_listings policies
DROP POLICY IF EXISTS "Sellers can view their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Buyers can view their purchased listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Wallet owners can create their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers can update their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Buyers can mark listing as purchased" ON public.marketplace_listings;

CREATE POLICY "Sellers can view their own listings"
ON public.marketplace_listings
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  seller_wallet_address = get_current_user_wallet()
);

CREATE POLICY "Buyers can view their purchased listings"
ON public.marketplace_listings
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  buyer_wallet_address = get_current_user_wallet()
);

CREATE POLICY "Users can create their own listings"
ON public.marketplace_listings
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  seller_wallet_address = get_current_user_wallet()
);

CREATE POLICY "Sellers can update their own listings"
ON public.marketplace_listings
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  seller_wallet_address = get_current_user_wallet()
);

CREATE POLICY "Buyers can mark listing as purchased"
ON public.marketplace_listings
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  status = 'active' AND
  buyer_wallet_address = get_current_user_wallet()
);

-- Update data_changes policies
DROP POLICY IF EXISTS "Users can view their own data changes" ON public.data_changes;

CREATE POLICY "Users can view their own data changes"
ON public.data_changes
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  wallet_address = get_current_user_wallet()
);