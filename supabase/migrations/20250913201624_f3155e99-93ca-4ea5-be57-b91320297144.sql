-- Fix admin authentication to work with wallet-based system
-- Drop the current is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

-- Create a new admin check that works with wallet authentication
CREATE OR REPLACE FUNCTION public.is_admin_wallet(p_wallet_address text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN p_wallet_address IS NOT NULL THEN p_wallet_address = 'mr_bruts.tg'
    WHEN auth.uid() IS NOT NULL THEN get_current_user_wallet() = 'mr_bruts.tg'
    ELSE false
  END;
$$;

-- Update banned_users policies to work with wallet-based admin check
DROP POLICY IF EXISTS "Only authenticated admins can view banned users" ON public.banned_users;
DROP POLICY IF EXISTS "Only authenticated admins can insert banned users" ON public.banned_users;
DROP POLICY IF EXISTS "Only authenticated admins can update banned users" ON public.banned_users;

-- Create more flexible admin policies for banned_users
CREATE POLICY "Admins can view all banned users"
ON public.banned_users
FOR SELECT
USING (banned_by_wallet_address = 'mr_bruts.tg' OR is_admin_wallet());

CREATE POLICY "Admins can insert banned users"
ON public.banned_users
FOR INSERT
WITH CHECK (banned_by_wallet_address = 'mr_bruts.tg');

CREATE POLICY "Admins can update banned users"
ON public.banned_users
FOR UPDATE
USING (banned_by_wallet_address = 'mr_bruts.tg' OR is_admin_wallet());

-- Update whitelist policies to work with wallet-based admin check
DROP POLICY IF EXISTS "Only authenticated admins can view all whitelist entries" ON public.whitelist;
DROP POLICY IF EXISTS "Only authenticated admins can insert whitelist entries" ON public.whitelist;
DROP POLICY IF EXISTS "Only authenticated admins can update whitelist entries" ON public.whitelist;

-- Create more flexible admin policies for whitelist
CREATE POLICY "Admins can view all whitelist entries"
ON public.whitelist
FOR SELECT
USING (added_by_wallet_address = 'mr_bruts.tg' OR is_admin_wallet());

CREATE POLICY "Admins can insert whitelist entries"
ON public.whitelist
FOR INSERT
WITH CHECK (added_by_wallet_address = 'mr_bruts.tg');

CREATE POLICY "Admins can update whitelist entries"
ON public.whitelist
FOR UPDATE
USING (added_by_wallet_address = 'mr_bruts.tg' OR is_admin_wallet());