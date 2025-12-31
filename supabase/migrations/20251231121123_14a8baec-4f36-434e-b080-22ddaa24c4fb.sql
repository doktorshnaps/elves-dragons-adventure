-- Добавляем пагинацию в функцию get_card_instances_by_wallet
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet_paginated(
  p_wallet_address TEXT,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.card_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  
  -- Возвращаем карты с пагинацией
  RETURN QUERY 
  SELECT * FROM public.card_instances
  WHERE wallet_address = p_wallet_address
  ORDER BY created_at DESC
  LIMIT LEAST(p_limit, 500) -- Максимум 500 за запрос
  OFFSET p_offset;
END;
$$;

-- Функция для подсчёта общего количества карт пользователя
CREATE OR REPLACE FUNCTION public.get_card_instances_count(
  p_wallet_address TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO total_count
  FROM public.card_instances
  WHERE wallet_address = p_wallet_address;
  
  RETURN total_count;
END;
$$;

-- Добавляем индекс для ускорения пагинации (если его ещё нет)
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_created 
ON public.card_instances(wallet_address, created_at DESC);

-- Добавляем индекс для item_instances
CREATE INDEX IF NOT EXISTS idx_item_instances_wallet_created 
ON public.item_instances(wallet_address, created_at DESC);

-- Обновляем оригинальную функцию для оптимизации
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet(
  p_wallet_address TEXT
)
RETURNS SETOF public.card_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  
  -- Убрали логи для производительности, добавили индексированный запрос
  RETURN QUERY 
  SELECT * FROM public.card_instances
  WHERE wallet_address = p_wallet_address
  ORDER BY created_at DESC
  LIMIT 1000;
END;
$$;