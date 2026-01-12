
-- Make sure ALL game_data policies are scoped to the authenticated role (avoid any public role policies).

DROP POLICY IF EXISTS "game_data_insert_policy" ON public.game_data;
CREATE POLICY "game_data_insert_policy"
ON public.game_data
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "game_data_update_policy" ON public.game_data;
CREATE POLICY "game_data_update_policy"
ON public.game_data
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);
