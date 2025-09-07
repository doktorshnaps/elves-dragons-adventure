-- Создаем таблицу для хранения состояния магазина
CREATE TABLE public.shop_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id integer NOT NULL,
  available_quantity integer NOT NULL DEFAULT 50,
  last_reset_time timestamp with time zone NOT NULL DEFAULT now(),
  next_reset_time timestamp with time zone NOT NULL DEFAULT (now() + interval '8 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.shop_inventory ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "Anyone can view shop inventory" 
ON public.shop_inventory 
FOR SELECT 
USING (true);

CREATE POLICY "System can update shop inventory" 
ON public.shop_inventory 
FOR UPDATE 
USING (true);

CREATE POLICY "System can insert shop inventory" 
ON public.shop_inventory 
FOR INSERT 
WITH CHECK (true);

-- Создаем индекс для быстрого поиска по item_id
CREATE INDEX idx_shop_inventory_item_id ON public.shop_inventory(item_id);

-- Создаем уникальный индекс, чтобы каждый предмет был только один раз в таблице
CREATE UNIQUE INDEX idx_shop_inventory_unique_item ON public.shop_inventory(item_id);

-- Создаем функцию для сброса магазина
CREATE OR REPLACE FUNCTION public.reset_shop_inventory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Добавляем триггер для автоматического обновления updated_at
CREATE TRIGGER update_shop_inventory_updated_at
BEFORE UPDATE ON public.shop_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Инициализируем магазин
SELECT public.reset_shop_inventory();