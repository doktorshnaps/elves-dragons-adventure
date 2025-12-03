-- RPC функция для завершения крафта и получения предметов
CREATE OR REPLACE FUNCTION public.complete_crafting_task(
  p_wallet_address TEXT,
  p_craft_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_workers JSONB;
  v_craft JSONB;
  v_result_item_id INTEGER;
  v_result_quantity INTEGER;
  v_item_template RECORD;
  v_new_workers JSONB;
  v_craft_found BOOLEAN := false;
  v_worker JSONB;
  i INTEGER;
BEGIN
  -- Получаем текущих активных рабочих
  SELECT active_workers INTO v_active_workers
  FROM game_data
  WHERE wallet_address = p_wallet_address;

  IF v_active_workers IS NULL OR jsonb_array_length(v_active_workers) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нет активных крафтов');
  END IF;

  -- Ищем нужный крафт по ID
  v_new_workers := '[]'::jsonb;
  
  FOR i IN 0..jsonb_array_length(v_active_workers) - 1 LOOP
    v_worker := v_active_workers->i;
    
    IF v_worker->>'id' = p_craft_id AND v_worker->>'task' = 'crafting' AND v_worker->>'building' = 'workshop' THEN
      v_craft_found := true;
      v_result_item_id := (v_worker->>'resultItemId')::INTEGER;
      v_result_quantity := (v_worker->>'resultQuantity')::INTEGER;
      -- Пропускаем этот крафт (не добавляем в новый массив)
    ELSE
      v_new_workers := v_new_workers || jsonb_build_array(v_worker);
    END IF;
  END LOOP;

  IF NOT v_craft_found THEN
    RETURN jsonb_build_object('success', false, 'error', 'Крафт не найден');
  END IF;

  -- Получаем информацию о предмете
  SELECT * INTO v_item_template
  FROM item_templates
  WHERE id = v_result_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Шаблон предмета не найден');
  END IF;

  -- Создаём предметы в item_instances
  FOR i IN 1..v_result_quantity LOOP
    INSERT INTO item_instances (wallet_address, template_id, item_id, name, type)
    VALUES (
      p_wallet_address,
      v_result_item_id,
      v_item_template.item_id,
      v_item_template.name,
      v_item_template.type
    );
  END LOOP;

  -- Обновляем active_workers (удаляем завершённый крафт)
  UPDATE game_data
  SET active_workers = v_new_workers,
      updated_at = NOW()
  WHERE wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'item_name', v_item_template.name,
    'quantity', v_result_quantity
  );
END;
$$;