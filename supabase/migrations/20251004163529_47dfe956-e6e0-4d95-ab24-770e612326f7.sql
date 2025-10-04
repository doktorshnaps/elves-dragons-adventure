-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by_wallet_address TEXT NOT NULL,
    UNIQUE (wallet_address, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(p_wallet_address TEXT, p_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE wallet_address = p_wallet_address
      AND role = p_role
  )
$$;

-- Create function to check if user is super admin or admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super(p_wallet_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE wallet_address = p_wallet_address
      AND role IN ('admin', 'super_admin')
  ) OR p_wallet_address = 'mr_bruts.tg';
$$;

-- RLS Policies for user_roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(get_current_user_wallet(), 'super_admin') OR get_current_user_wallet() = 'mr_bruts.tg');

CREATE POLICY "Anyone can view their own role"
ON public.user_roles
FOR SELECT
USING (wallet_address = get_current_user_wallet());

-- Function to add admin
CREATE OR REPLACE FUNCTION public.admin_add_administrator(
  p_wallet_address TEXT,
  p_admin_wallet_address TEXT DEFAULT 'mr_bruts.tg'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is super admin
  IF p_admin_wallet_address != 'mr_bruts.tg' AND NOT has_role(p_admin_wallet_address, 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only super admin can add administrators';
  END IF;

  -- Insert or update role
  INSERT INTO public.user_roles (wallet_address, role, created_by_wallet_address)
  VALUES (p_wallet_address, 'admin', p_admin_wallet_address)
  ON CONFLICT (wallet_address, role) 
  DO UPDATE SET updated_at = now();

  RETURN TRUE;
END;
$$;

-- Function to remove admin
CREATE OR REPLACE FUNCTION public.admin_remove_administrator(
  p_wallet_address TEXT,
  p_admin_wallet_address TEXT DEFAULT 'mr_bruts.tg'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is super admin
  IF p_admin_wallet_address != 'mr_bruts.tg' AND NOT has_role(p_admin_wallet_address, 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only super admin can remove administrators';
  END IF;

  -- Prevent removing mr_bruts.tg
  IF p_wallet_address = 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Cannot remove super admin';
  END IF;

  -- Delete role
  DELETE FROM public.user_roles 
  WHERE wallet_address = p_wallet_address 
    AND role = 'admin';

  RETURN TRUE;
END;
$$;

-- Update whitelist functions to allow admins
CREATE OR REPLACE FUNCTION public.admin_add_to_whitelist(
  p_wallet_address TEXT, 
  p_notes TEXT DEFAULT NULL, 
  p_admin_wallet_address TEXT DEFAULT 'mr_bruts.tg'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin or super admin
  IF NOT is_admin_or_super(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can manage whitelist';
  END IF;

  -- Insert or update whitelist entry
  INSERT INTO public.whitelist (wallet_address, added_by_wallet_address, notes)
  VALUES (p_wallet_address, p_admin_wallet_address, p_notes)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    is_active = true,
    notes = EXCLUDED.notes,
    updated_at = now();

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_from_whitelist(
  p_wallet_address TEXT, 
  p_admin_wallet_address TEXT DEFAULT 'mr_bruts.tg'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin or super admin
  IF NOT is_admin_or_super(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can manage whitelist';
  END IF;

  -- Deactivate whitelist entry
  UPDATE public.whitelist 
  SET is_active = false, updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN TRUE;
END;
$$;

-- Update ban functions to allow admins
CREATE OR REPLACE FUNCTION public.admin_ban_user(
  p_target_wallet_address TEXT, 
  p_reason TEXT, 
  p_admin_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin or super admin
  IF NOT is_admin_or_super(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can ban users';
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

CREATE OR REPLACE FUNCTION public.admin_unban_user(
  p_target_wallet_address TEXT, 
  p_admin_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin or super admin
  IF NOT is_admin_or_super(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can unban users';
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

-- Insert mr_bruts.tg as super admin
INSERT INTO public.user_roles (wallet_address, role, created_by_wallet_address)
VALUES ('mr_bruts.tg', 'super_admin', 'mr_bruts.tg')
ON CONFLICT (wallet_address, role) DO NOTHING;