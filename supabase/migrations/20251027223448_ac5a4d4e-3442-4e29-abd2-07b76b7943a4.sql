-- Функция для очистки старых фантомных записей из item_instances
-- Удаляет записи для mr_bruts.tg созданные до 2025-10-25
CREATE OR REPLACE FUNCTION cleanup_phantom_item_instances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.item_instances
  WHERE wallet_address = 'mr_bruts.tg'
    AND created_at < '2025-10-25'::timestamp;
  
  RAISE LOG 'Cleaned up phantom item instances for mr_bruts.tg';
END;
$$;

-- Вызываем функцию для немедленной очистки
SELECT cleanup_phantom_item_instances();