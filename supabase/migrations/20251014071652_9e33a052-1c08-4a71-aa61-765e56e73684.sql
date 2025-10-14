-- Drop all existing SELECT policies on banned_users
DROP POLICY IF EXISTS "Admins can view all banned users" ON public.banned_users;
DROP POLICY IF EXISTS "Anyone can view banned users" ON public.banned_users;

-- Create strict admin-only SELECT policy
CREATE POLICY "Only admins can view banned users"
ON public.banned_users
FOR SELECT
USING (is_admin_wallet() OR (get_current_user_wallet() = 'mr_bruts.tg'));