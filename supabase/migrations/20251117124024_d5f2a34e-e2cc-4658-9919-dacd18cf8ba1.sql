-- Fix RLS для treasure_hunt_events без использования NEW
DROP POLICY IF EXISTS "Treasure hunt select public" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Treasure hunt insert by admin wallet in payload" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Treasure hunt update by admin" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Treasure hunt delete by admin" ON public.treasure_hunt_events;

-- Публичный просмотр
CREATE POLICY "Treasure hunt select public"
ON public.treasure_hunt_events
FOR SELECT
TO public
USING (true);

-- Вставка через функцию которая проверяет created_by_wallet_address
CREATE POLICY "Treasure hunt insert by admin wallet in payload"
ON public.treasure_hunt_events
FOR INSERT
TO public
WITH CHECK (
  public.is_admin_or_super_wallet(created_by_wallet_address)
);

-- Обновление - только админы
CREATE POLICY "Treasure hunt update by admin"
ON public.treasure_hunt_events
FOR UPDATE
TO public
USING (
  public.is_admin_or_super_wallet(created_by_wallet_address)
);

-- Удаление - только админы
CREATE POLICY "Treasure hunt delete by admin"
ON public.treasure_hunt_events
FOR DELETE
TO public
USING (
  public.is_admin_or_super_wallet(created_by_wallet_address)
);