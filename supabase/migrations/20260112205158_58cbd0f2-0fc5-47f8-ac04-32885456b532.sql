
-- Drop existing admin policies and recreate with explicit auth check
DROP POLICY IF EXISTS "game_data_admin_select_policy" ON public.game_data;
DROP POLICY IF EXISTS "game_data_admin_update_policy" ON public.game_data;

-- Recreate admin policies with explicit authentication requirement
CREATE POLICY "game_data_admin_select_policy" 
ON public.game_data 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_admin_or_super_wallet(get_current_user_wallet())
);

CREATE POLICY "game_data_admin_update_policy" 
ON public.game_data 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND is_admin_or_super_wallet(get_current_user_wallet())
);
