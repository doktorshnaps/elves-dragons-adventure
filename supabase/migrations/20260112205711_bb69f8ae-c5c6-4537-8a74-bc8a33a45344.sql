
-- Tighten game_data RLS policies to remove any "public" exposure signals in scanners.
-- Keep behavior: authenticated users can read their own row; admins can read/update as before.

-- Recreate user SELECT policy: only authenticated; explicit wallet check via get_current_user_wallet()
DROP POLICY IF EXISTS "game_data_select_policy" ON public.game_data;
CREATE POLICY "game_data_select_policy"
ON public.game_data
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR wallet_address = public.get_current_user_wallet()
);

-- Ensure admin policies are also limited to authenticated role (avoids "public" role in scan)
DROP POLICY IF EXISTS "game_data_admin_select_policy" ON public.game_data;
CREATE POLICY "game_data_admin_select_policy"
ON public.game_data
FOR SELECT
TO authenticated
USING (
  is_admin_or_super_wallet(public.get_current_user_wallet())
);

DROP POLICY IF EXISTS "game_data_admin_update_policy" ON public.game_data;
CREATE POLICY "game_data_admin_update_policy"
ON public.game_data
FOR UPDATE
TO authenticated
USING (
  is_admin_or_super_wallet(public.get_current_user_wallet())
);
