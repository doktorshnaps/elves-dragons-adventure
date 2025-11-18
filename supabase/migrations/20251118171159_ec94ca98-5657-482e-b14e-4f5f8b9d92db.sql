-- Fix warn-level security issues: hardcoded admin checks and missing search_path

-- ==========================================
-- FIX 1: Replace hardcoded 'mr_bruts.tg' with is_admin_or_super_wallet()
-- ==========================================

-- Update banned_users policies to use is_admin_or_super_wallet()
DROP POLICY IF EXISTS "Admins can view all banned users" ON public.banned_users;
CREATE POLICY "Admins can view all banned users"
ON public.banned_users
FOR SELECT
USING (is_admin_or_super_wallet(get_current_user_wallet()));

DROP POLICY IF EXISTS "Admins can insert banned users" ON public.banned_users;
CREATE POLICY "Admins can insert banned users"
ON public.banned_users
FOR INSERT
WITH CHECK (is_admin_or_super_wallet(get_current_user_wallet()));

DROP POLICY IF EXISTS "Admins can update banned users" ON public.banned_users;
CREATE POLICY "Admins can update banned users"
ON public.banned_users
FOR UPDATE
USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- Also remove duplicate "Only admins can view banned users" policy
DROP POLICY IF EXISTS "Only admins can view banned users" ON public.banned_users;

-- Update whitelist policies to use is_admin_or_super_wallet()
DROP POLICY IF EXISTS "Admins can view all whitelist entries" ON public.whitelist;
CREATE POLICY "Admins can view all whitelist entries"
ON public.whitelist
FOR SELECT
USING (is_admin_or_super_wallet(get_current_user_wallet()));

DROP POLICY IF EXISTS "Admins can insert whitelist entries" ON public.whitelist;
CREATE POLICY "Admins can insert whitelist entries"
ON public.whitelist
FOR INSERT
WITH CHECK (is_admin_or_super_wallet(get_current_user_wallet()));

DROP POLICY IF EXISTS "Admins can update whitelist entries" ON public.whitelist;
CREATE POLICY "Admins can update whitelist entries"
ON public.whitelist
FOR UPDATE
USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- Update maintenance_mode policies to use is_admin_or_super_wallet()
DROP POLICY IF EXISTS "maintenance_mode_insert_policy" ON public.maintenance_mode;
CREATE POLICY "maintenance_mode_insert_policy"
ON public.maintenance_mode
FOR INSERT
WITH CHECK (is_admin_or_super_wallet(get_current_user_wallet()));

DROP POLICY IF EXISTS "maintenance_mode_update_policy" ON public.maintenance_mode;
CREATE POLICY "maintenance_mode_update_policy"
ON public.maintenance_mode
FOR UPDATE
USING (is_admin_or_super_wallet(get_current_user_wallet()));

DROP POLICY IF EXISTS "maintenance_mode_delete_policy" ON public.maintenance_mode;
CREATE POLICY "maintenance_mode_delete_policy"
ON public.maintenance_mode
FOR DELETE
USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- ==========================================
-- FIX 2: Add search_path to functions that don't have it (using CREATE OR REPLACE)
-- ==========================================

-- These functions already exist and are used by policies, so we just add search_path
-- without changing signatures to avoid dependency issues

CREATE OR REPLACE FUNCTION public.is_quest_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin_or_super_wallet(get_current_user_wallet());
$$;

-- Update existing helper functions used by admin RPC functions
CREATE OR REPLACE FUNCTION public.get_current_user_wallet()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_address text;
BEGIN
  SELECT wallet_address INTO v_wallet_address
  FROM public.game_data
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_wallet_address;
END;
$$;