-- Обновляем функцию batch крафта - теперь добавляет в очередь active_workers
CREATE OR REPLACE FUNCTION public.craft_multiple_items(
  p_wallet_address TEXT,
  p_recipes JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipe JSONB;
  v_recipe_id UUID;
  v_quantity INT;
  v_material JSONB;
  v_template_id INT;
  v_needed_qty INT;
  v_available_count INT;
  v_instance_ids UUID[];
  v_db_recipe RECORD;
  v_result_item_id INT;
  v_result_quantity INT;
  v_crafted_count INT := 0;
  v_item_template RECORD;
  v_game_data RECORD;
  v_active_workers JSONB;
  v_new_worker JSONB;
  v_crafting_time_ms BIGINT;
BEGIN
  -- Проверяем входные данные
  IF p_wallet_address IS NULL OR p_recipes IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing required parameters');
  END IF;

  -- Получаем текущие данные игрока
  SELECT * INTO v_game_data FROM game_data WHERE wallet_address = p_wallet_address;
  
  IF v_game_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player not found');
  END IF;
  
  v_active_workers := COALESCE(v_game_data.active_workers, '[]'::jsonb);

  -- Итерируем по каждому рецепту
  FOR v_recipe IN SELECT * FROM jsonb_array_elements(p_recipes)
  LOOP
    v_recipe_id := (v_recipe->>'recipe_id')::UUID;
    v_quantity := COALESCE((v_recipe->>'quantity')::INT, 1);
    
    -- Получаем рецепт из БД
    SELECT * INTO v_db_recipe 
    FROM crafting_recipes 
    WHERE id = v_recipe_id AND is_active = true;
    
    IF v_db_recipe IS NULL THEN
      CONTINUE; -- Пропускаем неактивный или несуществующий рецепт
    END IF;
    
    v_result_item_id := v_db_recipe.result_item_id;
    v_result_quantity := COALESCE(v_db_recipe.result_quantity, 1) * v_quantity;
    
    -- Время крафта в миллисекундах (crafting_time_hours * 60 * 60 * 1000)
    v_crafting_time_ms := COALESCE(v_db_recipe.crafting_time_hours, 1) * 3600000;
    
    -- Проверяем и удаляем материалы (БЕЗ повторного умножения - quantity уже учтено в запросе)
    FOR v_material IN SELECT * FROM jsonb_array_elements(v_db_recipe.required_materials)
    LOOP
      v_template_id := NULL;
      -- Умножаем только на v_quantity (количество крафтов)
      v_needed_qty := COALESCE((v_material->>'quantity')::INT, 1) * v_quantity;
      
      -- Получаем template_id по item_id
      SELECT id INTO v_template_id 
      FROM item_templates 
      WHERE item_id = (v_material->>'item_id');
      
      IF v_template_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Material template not found: ' || (v_material->>'item_id'));
      END IF;
      
      -- Проверяем наличие достаточного количества
      SELECT COUNT(*) INTO v_available_count
      FROM item_instances
      WHERE wallet_address = p_wallet_address 
        AND template_id = v_template_id;
      
      IF v_available_count < v_needed_qty THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not enough materials: ' || (v_material->>'item_id'));
      END IF;
      
      -- Получаем ID инстансов для удаления
      SELECT ARRAY_AGG(id) INTO v_instance_ids
      FROM (
        SELECT id FROM item_instances
        WHERE wallet_address = p_wallet_address 
          AND template_id = v_template_id
        LIMIT v_needed_qty
      ) sub;
      
      -- Удаляем использованные материалы
      DELETE FROM item_instances WHERE id = ANY(v_instance_ids);
    END LOOP;
    
    -- Создаём новый worker для активного крафта
    v_new_worker := jsonb_build_object(
      'id', gen_random_uuid(),
      'building', 'workshop',
      'task', 'crafting',
      'startTime', EXTRACT(epoch FROM now()) * 1000,
      'duration', v_crafting_time_ms,
      'resultItemId', v_result_item_id,
      'resultQuantity', v_result_quantity
    );
    
    -- Добавляем в массив активных рабочих
    v_active_workers := v_active_workers || v_new_worker;
    v_crafted_count := v_crafted_count + v_result_quantity;
  END LOOP;
  
  -- Обновляем active_workers в game_data
  UPDATE game_data 
  SET active_workers = v_active_workers,
      updated_at = now()
  WHERE wallet_address = p_wallet_address;
  
  RETURN jsonb_build_object(
    'success', true, 
    'total_crafted', v_crafted_count,
    'recipes_processed', jsonb_array_length(p_recipes),
    'message', 'Crafting started for ' || v_crafted_count || ' items'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;