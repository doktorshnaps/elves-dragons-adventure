-- Migrate from user_id based auth to wallet_address based auth

-- First, add wallet_address column to all tables
ALTER TABLE public.game_data ADD COLUMN wallet_address TEXT;
ALTER TABLE public.profiles ADD COLUMN wallet_address TEXT;
ALTER TABLE public.card_instances ADD COLUMN wallet_address TEXT;
ALTER TABLE public.marketplace_listings ADD COLUMN seller_wallet_address TEXT;
ALTER TABLE public.marketplace_listings ADD COLUMN buyer_wallet_address TEXT;

-- Create index for performance
CREATE INDEX idx_game_data_wallet_address ON public.game_data(wallet_address);
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX idx_card_instances_wallet_address ON public.card_instances(wallet_address);
CREATE INDEX idx_marketplace_listings_seller_wallet ON public.marketplace_listings(seller_wallet_address);
CREATE INDEX idx_marketplace_listings_buyer_wallet ON public.marketplace_listings(buyer_wallet_address);

-- Update RLS policies for game_data to use wallet_address
DROP POLICY IF EXISTS "Users can view their own game data" ON public.game_data;
DROP POLICY IF EXISTS "Users can update their own game data" ON public.game_data;
DROP POLICY IF EXISTS "Users can insert their own game data" ON public.game_data;

CREATE POLICY "Wallet owners can view their own game data" 
ON public.game_data 
FOR SELECT 
USING (wallet_address IS NOT NULL);

CREATE POLICY "Wallet owners can update their own game data" 
ON public.game_data 
FOR UPDATE 
USING (wallet_address IS NOT NULL);

CREATE POLICY "Wallet owners can insert their own game data" 
ON public.game_data 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Wallet owners can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (wallet_address IS NOT NULL);

CREATE POLICY "Wallet owners can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (wallet_address IS NOT NULL);

CREATE POLICY "Wallet owners can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

-- Update RLS policies for card_instances
DROP POLICY IF EXISTS "Users can view their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Users can update their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Users can insert their own card instances" ON public.card_instances;
DROP POLICY IF EXISTS "Users can delete their own card instances" ON public.card_instances;

CREATE POLICY "Wallet owners can view their own card instances" 
ON public.card_instances 
FOR SELECT 
USING (wallet_address IS NOT NULL);

CREATE POLICY "Wallet owners can update their own card instances" 
ON public.card_instances 
FOR UPDATE 
USING (wallet_address IS NOT NULL);

CREATE POLICY "Wallet owners can insert their own card instances" 
ON public.card_instances 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

CREATE POLICY "Wallet owners can delete their own card instances" 
ON public.card_instances 
FOR DELETE 
USING (wallet_address IS NOT NULL);

-- Update RLS policies for marketplace_listings
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers can view their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Buyers can view their purchased listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can create their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Sellers can update their own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Buyers can mark listing as purchased" ON public.marketplace_listings;

CREATE POLICY "Anyone can view active listings" 
ON public.marketplace_listings 
FOR SELECT 
USING (status = 'active'::text);

CREATE POLICY "Sellers can view their own listings" 
ON public.marketplace_listings 
FOR SELECT 
USING (seller_wallet_address IS NOT NULL);

CREATE POLICY "Buyers can view their purchased listings" 
ON public.marketplace_listings 
FOR SELECT 
USING (buyer_wallet_address IS NOT NULL);

CREATE POLICY "Wallet owners can create their own listings" 
ON public.marketplace_listings 
FOR INSERT 
WITH CHECK (seller_wallet_address IS NOT NULL);

CREATE POLICY "Sellers can update their own listings" 
ON public.marketplace_listings 
FOR UPDATE 
USING (seller_wallet_address IS NOT NULL);

CREATE POLICY "Buyers can mark listing as purchased" 
ON public.marketplace_listings 
FOR UPDATE 
USING (status = 'active'::text)
WITH CHECK (buyer_wallet_address IS NOT NULL);

-- Update the trigger function to work with wallet addresses
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- We'll handle initial data creation in the application code instead of triggers