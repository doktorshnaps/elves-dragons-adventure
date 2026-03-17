-- Fix broken card_instances UPDATE policy that allows any authenticated user to update any card
DROP POLICY IF EXISTS card_instances_update_policy ON public.card_instances;
CREATE POLICY card_instances_update_policy ON public.card_instances
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL)
    AND (
      wallet_address = get_current_user_wallet()
      OR user_id = auth.uid()
    )
  );