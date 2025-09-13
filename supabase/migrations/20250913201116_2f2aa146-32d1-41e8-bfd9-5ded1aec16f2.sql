-- Create secure admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    WHEN get_current_user_wallet() = 'mr_bruts.tg' THEN true
    ELSE false
  END;
$$;

-- Drop existing policies on banned_users
DROP POLICY IF EXISTS "Admins can view all banned users" ON public.banned_users;
DROP POLICY IF EXISTS "Admins can insert banned users" ON public.banned_users;
DROP POLICY IF EXISTS "Admins can update banned users" ON public.banned_users;

-- Create new secure policies for banned_users
CREATE POLICY "Only authenticated admins can view banned users"
ON public.banned_users
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Only authenticated admins can insert banned users"
ON public.banned_users
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Only authenticated admins can update banned users"
ON public.banned_users
FOR UPDATE
TO authenticated
USING (is_admin());

-- Drop existing admin policies on whitelist (keep user self-check)
DROP POLICY IF EXISTS "Admins can view all whitelist entries" ON public.whitelist;
DROP POLICY IF EXISTS "Admins can insert whitelist entries" ON public.whitelist;
DROP POLICY IF EXISTS "Admins can update whitelist entries" ON public.whitelist;

-- Create new secure policies for whitelist
CREATE POLICY "Only authenticated admins can view all whitelist entries"
ON public.whitelist
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Only authenticated admins can insert whitelist entries"
ON public.whitelist
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Only authenticated admins can update whitelist entries"
ON public.whitelist
FOR UPDATE
TO authenticated
USING (is_admin());