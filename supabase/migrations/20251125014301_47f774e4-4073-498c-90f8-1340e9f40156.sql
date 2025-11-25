-- Исправление 1: batch_update_card_stats - добавление явного приведения типа UUID
CREATE OR REPLACE FUNCTION public.batch_update_card_stats(
  p_wallet_address text,
  p_card_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_card_update JSONB;
  v_updated_count INTEGER := 0;
BEGIN
  -- Обрабатываем каждое обновление карты
  FOR v_card_update IN SELECT * FROM jsonb_array_elements(p_card_updates)
  LOOP
    UPDATE card_instances
    SET 
      current_health = COALESCE((v_card_update->>'current_health')::INTEGER, current_health),
      current_defense = COALESCE((v_card_update->>'current_defense')::INTEGER, current_defense),
      monster_kills = COALESCE((v_card_update->>'monster_kills')::INTEGER, monster_kills),
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address
      AND id = (v_card_update->>'card_instance_id')::uuid; -- ИСПРАВЛЕНО: добавлено ::uuid
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'cards_updated', v_updated_count
  );
END;
$$;

-- Исправление 2: Функция для правильного расчета характеристик карт
-- с учетом classLevel, rarity и мультипликаторов
CREATE OR REPLACE FUNCTION public.recalculate_card_stats()
RETURNS TABLE(
  card_instance_id uuid,
  old_health integer,
  new_health integer,
  old_defense integer,
  new_defense integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_card_instance RECORD;
  v_base_health INTEGER := 100;
  v_base_defense INTEGER := 10;
  v_rarity_mult NUMERIC := 1.0;
  v_class_mult NUMERIC := 1.0;
  v_new_max_health INTEGER;
  v_new_max_defense INTEGER;
  v_health_ratio NUMERIC;
  v_defense_ratio NUMERIC;
BEGIN
  -- Перебираем все card_instances типа hero и dragon
  FOR v_card_instance IN
    SELECT 
      ci.id,
      ci.card_type,
      ci.current_health,
      ci.max_health,
      ci.current_defense,
      ci.max_defense,
      (ci.card_data->>'rarity')::integer as rarity,
      ci.card_data->>'cardClass' as card_class,
      (ci.card_data->>'classLevel')::integer as class_level
    FROM card_instances ci
    WHERE ci.card_type IN ('hero', 'dragon')
  LOOP
    -- Получаем rarity multiplier
    SELECT COALESCE(rm.multiplier, 1.0)
    INTO v_rarity_mult
    FROM rarity_multipliers rm
    WHERE rm.rarity = v_card_instance.rarity;
    
    -- Получаем class multiplier по cardClass
    SELECT COALESCE(cm.health_multiplier, 1.0)
    INTO v_class_mult
    FROM class_multipliers cm
    WHERE cm.class_name = v_card_instance.card_class;
    
    -- Рассчитываем новые максимальные характеристики
    v_new_max_health := CEIL(v_base_health * v_rarity_mult * v_class_mult);
    v_new_max_defense := CEIL(v_base_defense * v_rarity_mult * v_class_mult);
    
    -- Сохраняем пропорцию текущего здоровья и брони
    v_health_ratio := CASE 
      WHEN v_card_instance.max_health > 0 
      THEN v_card_instance.current_health::numeric / v_card_instance.max_health 
      ELSE 1.0 
    END;
    
    v_defense_ratio := CASE 
      WHEN v_card_instance.max_defense > 0 
      THEN v_card_instance.current_defense::numeric / v_card_instance.max_defense 
      ELSE 1.0 
    END;
    
    -- Обновляем характеристики карты
    UPDATE card_instances
    SET
      max_health = v_new_max_health,
      max_defense = v_new_max_defense,
      current_health = CEIL(v_new_max_health * v_health_ratio),
      current_defense = CEIL(v_new_max_defense * v_defense_ratio),
      updated_at = NOW()
    WHERE id = v_card_instance.id;
    
    -- Возвращаем результат для логирования
    RETURN QUERY SELECT 
      v_card_instance.id,
      v_card_instance.max_health,
      v_new_max_health,
      v_card_instance.max_defense,
      v_new_max_defense;
  END LOOP;
END;
$$;