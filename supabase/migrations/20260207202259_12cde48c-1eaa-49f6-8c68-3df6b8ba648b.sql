-- Fix: Block direct SELECT on game_data for non-admin users
-- All player data access goes through SECURITY DEFINER RPCs (get_game_data_by_wallet_full_v2, initialize_game_data_by_wallet)
-- Admin access via game_data_admin_select_policy is preserved

DROP POLICY IF EXISTS "game_data_select_policy" ON public.game_data;

-- Replace with explicit deny for direct user access
CREATE POLICY "game_data_no_direct_select"
  ON public.game_data FOR SELECT
  USING (false);

-- Also block direct UPDATE for non-admin users (all updates go through RPCs/edge functions with service role)
DROP POLICY IF EXISTS "game_data_update_policy" ON public.game_data;

CREATE POLICY "game_data_no_direct_update"
  ON public.game_data FOR UPDATE
  USING (false);

-- Note: game_data_admin_select_policy and game_data_admin_update_policy are preserved for admin access
-- Note: game_data_insert_policy already requires auth.uid() which is always NULL with NEAR wallet auth