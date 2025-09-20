-- Fix user_id constraint issues in game_data table
-- The current constraint is too strict, making user_id NOT NULL but it should allow wallet-based access

-- First, let's check the current RLS policies and see if we need to adjust them
-- We need to ensure that when creating game_data, user_id can be NULL initially 
-- and be set later through wallet authentication

-- Update the allow_wallet_create_game_data policy to handle user_id properly
DROP POLICY IF EXISTS "allow_wallet_create_game_data" ON public.game_data;

CREATE POLICY "allow_wallet_create_game_data" 
ON public.game_data 
FOR INSERT 
WITH CHECK (
  -- Allow creation with valid wallet_address, user_id can be null initially
  wallet_address IS NOT NULL AND length(trim(wallet_address)) > 0
);

-- Also ensure the card_instances table has proper RLS for workers
-- Workers should be accessible just like other cards
UPDATE public.card_instances 
SET user_id = (
  SELECT gd.user_id 
  FROM public.game_data gd 
  WHERE gd.wallet_address = card_instances.wallet_address 
  LIMIT 1
)
WHERE user_id IS NULL AND wallet_address IS NOT NULL;

-- Update game_data records that have wallet_address but no user_id
-- These should get user_id from profiles table if available
UPDATE public.game_data 
SET user_id = (
  SELECT p.user_id 
  FROM public.profiles p 
  WHERE p.wallet_address = game_data.wallet_address 
  LIMIT 1
)
WHERE user_id IS NULL AND wallet_address IS NOT NULL;

-- Create function to ensure workers get proper card instances
CREATE OR REPLACE FUNCTION create_worker_card_instance(
  p_wallet_address text,
  p_worker_data jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_instance_id uuid;
  v_health integer := 100;
BEGIN
  -- Get user_id for the wallet
  SELECT user_id INTO v_user_id
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  -- Create card instance for worker
  INSERT INTO public.card_instances (
    user_id,
    wallet_address,
    card_template_id,
    card_type,
    current_health,
    max_health,
    card_data,
    last_heal_time
  ) VALUES (
    v_user_id,
    p_wallet_address,
    p_worker_data->>'id',
    'hero', -- Use hero type since workers type not fully supported
    v_health,
    v_health,
    p_worker_data,
    now()
  ) RETURNING id INTO v_instance_id;

  RETURN v_instance_id;
END;
$$;