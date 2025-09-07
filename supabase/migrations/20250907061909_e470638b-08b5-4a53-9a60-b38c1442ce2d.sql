-- Исправляем функцию reset_shop_inventory с правильным search_path
CREATE OR REPLACE FUNCTION public.reset_shop_inventory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Обновляем количество всех товаров до 50 и устанавливаем новое время сброса
  UPDATE public.shop_inventory 
  SET 
    available_quantity = 50,
    last_reset_time = now(),
    next_reset_time = now() + interval '8 hours',
    updated_at = now()
  WHERE next_reset_time <= now();

  -- Если таблица пустая, добавляем все предметы
  IF NOT EXISTS (SELECT 1 FROM public.shop_inventory LIMIT 1) THEN
    INSERT INTO public.shop_inventory (item_id, available_quantity, last_reset_time, next_reset_time)
    SELECT 
      generate_series(1, 12) as item_id,
      50 as available_quantity,
      now() as last_reset_time,
      now() + interval '8 hours' as next_reset_time;
  END IF;
END;
$$;