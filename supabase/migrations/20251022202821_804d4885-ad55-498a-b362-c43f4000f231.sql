-- Align building_configs policies to allow both admins and super_admins via is_admin_or_super_wallet

-- Update INSERT policy to use is_admin_or_super_wallet
ALTER POLICY "Only admins can insert building configs"
ON public.building_configs
WITH CHECK (is_admin_or_super_wallet(get_current_user_wallet()));

-- Update UPDATE policy to use is_admin_or_super_wallet
ALTER POLICY "Only admins can update building configs"
ON public.building_configs
USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- Update DELETE policy to use is_admin_or_super_wallet
ALTER POLICY "Only admins can delete building configs"
ON public.building_configs
USING (is_admin_or_super_wallet(get_current_user_wallet()));