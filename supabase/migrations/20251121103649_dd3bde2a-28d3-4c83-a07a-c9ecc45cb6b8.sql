-- Добавляем индекс на is_active в whitelist для оптимизации проверок
CREATE INDEX IF NOT EXISTS idx_whitelist_is_active 
ON public.whitelist(is_active) 
WHERE is_active = true;

-- Добавляем составной индекс для быстрой проверки активного вайтлиста
CREATE INDEX IF NOT EXISTS idx_whitelist_wallet_active 
ON public.whitelist(wallet_address, is_active) 
WHERE is_active = true;

-- Оптимизируем функцию is_whitelisted для использования индексов
CREATE OR REPLACE FUNCTION public.is_whitelisted(p_wallet_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Используем EXISTS для более быстрой проверки
  RETURN EXISTS (
    SELECT 1 
    FROM public.whitelist 
    WHERE wallet_address = p_wallet_address 
      AND is_active = true
    LIMIT 1
  );
END;
$$;