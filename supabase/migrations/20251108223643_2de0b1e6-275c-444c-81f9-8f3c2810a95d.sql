-- Исправляем функцию с установкой search_path для безопасности
CREATE OR REPLACE FUNCTION filter_blocked_nft_contracts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blocked_contracts TEXT[] := ARRAY['doubledog.hot.tg'];
BEGIN
  -- Проверяем, является ли контракт заблокированным
  IF NEW.nft_contract_id = ANY(blocked_contracts) THEN
    RAISE EXCEPTION 'Contract % is blocked', NEW.nft_contract_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Обновляем комментарий
COMMENT ON FUNCTION filter_blocked_nft_contracts() IS 'Блокирует вставку и обновление карт из нежелательных NFT контрактов (secure)';