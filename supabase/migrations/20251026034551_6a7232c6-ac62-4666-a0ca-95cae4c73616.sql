-- Исправляем search_path для безопасности

DROP FUNCTION IF EXISTS update_active_workers_by_wallet(text, jsonb);

CREATE OR REPLACE FUNCTION update_active_workers_by_wallet(
  p_wallet_address text,
  p_active_workers jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Обновляем active_workers в game_data для указанного кошелька
  UPDATE game_data
  SET 
    active_workers = p_active_workers,
    updated_at = now()
  WHERE wallet_address = p_wallet_address;
  
  -- Если запись не найдена, создаем новую
  IF NOT FOUND THEN
    INSERT INTO game_data (wallet_address, active_workers, initialized)
    VALUES (p_wallet_address, p_active_workers, true)
    ON CONFLICT (wallet_address) 
    DO UPDATE SET 
      active_workers = p_active_workers,
      updated_at = now();
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS remove_card_instance_exact(text, uuid);

CREATE OR REPLACE FUNCTION remove_card_instance_exact(
  p_wallet_address text,
  p_instance_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted boolean := false;
BEGIN
  -- Удаляем карту из card_instances
  DELETE FROM card_instances
  WHERE id = p_instance_id 
    AND wallet_address = p_wallet_address;
  
  -- Проверяем, была ли удалена запись
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted > 0;
END;
$$;