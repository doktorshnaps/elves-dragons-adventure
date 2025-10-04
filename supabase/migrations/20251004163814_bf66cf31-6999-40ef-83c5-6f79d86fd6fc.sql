-- Update RLS policy to allow viewing all admin roles
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view their own role" ON public.user_roles;

-- Allow super admins to do everything
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (get_current_user_wallet() = 'mr_bruts.tg' OR has_role(get_current_user_wallet(), 'super_admin'));

-- Allow super admins to view all roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (get_current_user_wallet() = 'mr_bruts.tg' OR has_role(get_current_user_wallet(), 'super_admin'));

-- Allow anyone to view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (wallet_address = get_current_user_wallet());