-- Удаляем все карты из контракта doubledog.hot.tg
DELETE FROM card_instances 
WHERE nft_contract_id = 'doubledog.hot.tg';

-- Удаляем записи из user_nft_cards если такая таблица существует
DELETE FROM user_nft_cards 
WHERE nft_contract_id = 'doubledog.hot.tg';

-- Создаем функцию для фильтрации карт из нежелательных контрактов
CREATE OR REPLACE FUNCTION filter_blocked_nft_contracts()
RETURNS TRIGGER AS $$
DECLARE
  blocked_contracts TEXT[] := ARRAY['doubledog.hot.tg'];
BEGIN
  -- Проверяем, является ли контракт заблокированным
  IF NEW.nft_contract_id = ANY(blocked_contracts) THEN
    RAISE EXCEPTION 'Contract % is blocked', NEW.nft_contract_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для предотвращения вставки карт из заблокированных контрактов
DROP TRIGGER IF EXISTS prevent_blocked_contracts_trigger ON card_instances;
CREATE TRIGGER prevent_blocked_contracts_trigger
  BEFORE INSERT OR UPDATE ON card_instances
  FOR EACH ROW
  EXECUTE FUNCTION filter_blocked_nft_contracts();

-- Добавляем комментарий
COMMENT ON FUNCTION filter_blocked_nft_contracts() IS 'Блокирует вставку и обновление карт из нежелательных NFT контрактов';