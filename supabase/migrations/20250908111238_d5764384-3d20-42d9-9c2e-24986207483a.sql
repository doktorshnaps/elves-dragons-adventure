-- Create banned_users table for admin functionality
CREATE TABLE public.banned_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banned_wallet_address TEXT NOT NULL,
  banned_by_wallet_address TEXT NOT NULL,
  reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all banned users" 
ON public.banned_users 
FOR SELECT 
USING (banned_by_wallet_address = 'mr_bruts.tg');

CREATE POLICY "Admins can insert banned users" 
ON public.banned_users 
FOR INSERT 
WITH CHECK (banned_by_wallet_address = 'mr_bruts.tg');

CREATE POLICY "Admins can update banned users" 
ON public.banned_users 
FOR UPDATE 
USING (banned_by_wallet_address = 'mr_bruts.tg');

-- Create admin function to add balance
CREATE OR REPLACE FUNCTION public.admin_add_balance(
  p_target_wallet_address TEXT,
  p_amount INTEGER,
  p_admin_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can add balance';
  END IF;

  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE wallet_address = p_target_wallet_address) THEN
    RAISE EXCEPTION 'User not found: %', p_target_wallet_address;
  END IF;

  -- Add balance
  UPDATE public.game_data 
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE wallet_address = p_target_wallet_address;

  RETURN TRUE;
END;
$$;

-- Create admin function to ban user
CREATE OR REPLACE FUNCTION public.admin_ban_user(
  p_target_wallet_address TEXT,
  p_reason TEXT,
  p_admin_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can ban users';
  END IF;

  -- Insert ban record
  INSERT INTO public.banned_users (
    banned_wallet_address,
    banned_by_wallet_address,
    reason
  ) VALUES (
    p_target_wallet_address,
    p_admin_wallet_address,
    p_reason
  );

  RETURN TRUE;
END;
$$;

-- Create admin function to unban user
CREATE OR REPLACE FUNCTION public.admin_unban_user(
  p_target_wallet_address TEXT,
  p_admin_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can unban users';
  END IF;

  -- Deactivate ban records
  UPDATE public.banned_users 
  SET is_active = false,
      updated_at = now()
  WHERE banned_wallet_address = p_target_wallet_address 
    AND is_active = true;

  RETURN TRUE;
END;
$$;