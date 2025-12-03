-- Создаём функцию batch крафта предметов
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
BEGIN
  -- Проверяем входные данные
  IF p_wallet_address IS NULL OR p_recipes IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing required parameters');
  END IF;

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
    
    -- Проверяем и удаляем материалы
    FOR v_material IN SELECT * FROM jsonb_array_elements(v_db_recipe.required_materials)
    LOOP
      v_template_id := NULL;
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
    
    -- Получаем данные о результирующем предмете
    SELECT * INTO v_item_template FROM item_templates WHERE id = v_result_item_id;
    
    IF v_item_template IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Result item template not found');
    END IF;
    
    -- Создаём результирующие предметы
    FOR i IN 1..v_result_quantity LOOP
      INSERT INTO item_instances (
        wallet_address,
        template_id,
        item_id,
        name,
        type
      ) VALUES (
        p_wallet_address,
        v_result_item_id,
        v_item_template.item_id,
        v_item_template.name,
        v_item_template.type
      );
      v_crafted_count := v_crafted_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true, 
    'crafted_count', v_crafted_count,
    'message', 'Successfully crafted ' || v_crafted_count || ' items'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;