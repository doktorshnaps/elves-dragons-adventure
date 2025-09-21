-- Исправляем функцию atomic_balance_update, добавляя SET search_path для безопасности
CREATE OR REPLACE FUNCTION atomic_balance_update(
  p_wallet_address TEXT,
  p_price_deduction INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_record RECORD;
  current_version INTEGER;
  new_balance INTEGER;
  result JSONB;
BEGIN
  -- Получаем текущие данные с блокировкой
  SELECT balance, version, user_id, id 
  INTO current_record
  FROM game_data 
  WHERE wallet_address = p_wallet_address
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game data not found for wallet address: %', p_wallet_address;
  END IF;
  
  -- Проверяем достаточность средств
  IF current_record.balance < p_price_deduction THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', current_record.balance, p_price_deduction;
  END IF;
  
  -- Вычисляем новый баланс
  new_balance := current_record.balance - p_price_deduction;
  current_version := COALESCE(current_record.version, 1) + 1;
  
  -- Обновляем баланс и версию
  UPDATE game_data 
  SET 
    balance = new_balance,
    version = current_version,
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;
  
  -- Логируем изменение
  INSERT INTO data_changes (
    record_id, 
    table_name, 
    change_type,
    wallet_address,
    old_data, 
    new_data, 
    version_from, 
    version_to,
    created_by
  ) VALUES (
    current_record.id,
    'game_data',
    'balance_update',
    p_wallet_address,
    jsonb_build_object('balance', current_record.balance),
    jsonb_build_object('balance', new_balance),
    current_record.version,
    current_version,
    p_wallet_address
  );
  
  -- Возвращаем результат
  result := jsonb_build_object(
    'success', true,
    'old_balance', current_record.balance,
    'new_balance', new_balance,
    'deducted', p_price_deduction,
    'version', current_version
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in atomic_balance_update: %', SQLERRM;
END;
$$;