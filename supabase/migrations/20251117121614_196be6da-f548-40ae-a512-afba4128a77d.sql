-- Добавляем RLS политики для таблицы treasure_hunt_events

-- Включаем RLS если еще не включено
ALTER TABLE public.treasure_hunt_events ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если существуют
DROP POLICY IF EXISTS "Admins can insert treasure hunt events" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Admins can update treasure hunt events" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Admins can delete treasure hunt events" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Anyone can view treasure hunt events" ON public.treasure_hunt_events;

-- Политика на создание событий (только админы и super админы)
CREATE POLICY "Admins can insert treasure hunt events"
ON public.treasure_hunt_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_super_wallet(
    COALESCE(
      auth.jwt() ->> 'wallet_address',
      (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1)
    )
  )
);

-- Политика на обновление событий (только админы и super админы)
CREATE POLICY "Admins can update treasure hunt events"
ON public.treasure_hunt_events
FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_super_wallet(
    COALESCE(
      auth.jwt() ->> 'wallet_address',
      (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1)
    )
  )
);

-- Политика на удаление событий (только админы и super админы)
CREATE POLICY "Admins can delete treasure hunt events"
ON public.treasure_hunt_events
FOR DELETE
TO authenticated
USING (
  public.is_admin_or_super_wallet(
    COALESCE(
      auth.jwt() ->> 'wallet_address',
      (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1)
    )
  )
);

-- Политика на просмотр событий (все могут видеть активные события)
CREATE POLICY "Anyone can view treasure hunt events"
ON public.treasure_hunt_events
FOR SELECT
TO authenticated
USING (true);