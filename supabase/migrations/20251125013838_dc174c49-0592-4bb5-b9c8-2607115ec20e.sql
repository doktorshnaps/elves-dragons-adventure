-- Исправление RLS политик card_instances для SECURITY DEFINER функций
-- Проблема: batch_update_card_stats не работает для NEAR пользователей без auth.uid()

-- Обновляем UPDATE политику для card_instances
DROP POLICY IF EXISTS card_instances_update_policy ON public.card_instances;

CREATE POLICY card_instances_update_policy ON public.card_instances
FOR UPDATE
TO public
USING (
  -- Разрешаем SECURITY DEFINER функциям (batch healing, forge, medical bay)
  current_setting('role', true) = 'authenticated'
  OR
  -- Разрешаем владельцу по wallet_address (работает даже без auth.uid())
  wallet_address = get_current_user_wallet()
  OR
  -- Разрешаем владельцу по user_id (если есть Supabase Auth)
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);