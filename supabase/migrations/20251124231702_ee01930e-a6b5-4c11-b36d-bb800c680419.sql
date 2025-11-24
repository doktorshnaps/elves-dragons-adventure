-- Обновляем существующие card_instances для пересчета характеристик с учетом мультипликаторов

DO $$
DECLARE
  instance_rec RECORD;
  v_card_type text;
  v_card_name text;
  v_card_class text;
  v_rarity integer;
  
  -- Базовые характеристики
  v_hero_base record;
  v_dragon_base record;
  v_base_health integer;
  v_base_defense integer;
  v_base_power integer;
  v_base_magic integer;
  
  -- Мультипликаторы
  v_rarity_mult numeric;
  v_class_mult_health numeric;
  v_class_mult_defense numeric;
  v_class_mult_power numeric;
  v_class_mult_magic numeric;
  
  -- Вычисленные характеристики
  v_max_health integer;
  v_max_defense integer;
  v_updated integer := 0;
BEGIN
  -- Загружаем базовые характеристики
  SELECT * INTO v_hero_base FROM public.hero_base_stats LIMIT 1;
  SELECT * INTO v_dragon_base FROM public.dragon_base_stats LIMIT 1;
  
  -- Перебираем все card_instances, которые имеют характеристики по умолчанию
  FOR instance_rec IN 
    SELECT id, card_type, card_data, current_health, current_defense
    FROM public.card_instances
    WHERE card_type IN ('hero', 'dragon')
  LOOP
    v_card_class := instance_rec.card_data->>'cardClass';
    v_rarity := COALESCE((instance_rec.card_data->>'rarity')::integer, 1);
    
    -- Определяем базовые характеристики
    IF instance_rec.card_type = 'hero' THEN
      v_base_health := v_hero_base.health;
      v_base_defense := v_hero_base.defense;
      v_base_power := v_hero_base.power;
      v_base_magic := v_hero_base.magic;
    ELSE
      v_base_health := v_dragon_base.health;
      v_base_defense := v_dragon_base.defense;
      v_base_power := v_dragon_base.power;
      v_base_magic := v_dragon_base.magic;
    END IF;
    
    -- Получаем мультипликатор редкости
    SELECT multiplier INTO v_rarity_mult
    FROM public.rarity_multipliers
    WHERE rarity = v_rarity
    LIMIT 1;
    v_rarity_mult := COALESCE(v_rarity_mult, 1.0);
    
    -- Получаем мультипликаторы класса
    IF instance_rec.card_type = 'hero' THEN
      SELECT health_multiplier, defense_multiplier, power_multiplier, magic_multiplier
      INTO v_class_mult_health, v_class_mult_defense, v_class_mult_power, v_class_mult_magic
      FROM public.class_multipliers
      WHERE class_name = v_card_class
      LIMIT 1;
    ELSE
      SELECT health_multiplier, defense_multiplier, power_multiplier, magic_multiplier
      INTO v_class_mult_health, v_class_mult_defense, v_class_mult_power, v_class_mult_magic
      FROM public.dragon_class_multipliers
      WHERE class_name = v_card_class
      LIMIT 1;
    END IF;
    
    v_class_mult_health := COALESCE(v_class_mult_health, 1.0);
    v_class_mult_defense := COALESCE(v_class_mult_defense, 1.0);
    v_class_mult_power := COALESCE(v_class_mult_power, 1.0);
    v_class_mult_magic := COALESCE(v_class_mult_magic, 1.0);
    
    -- Вычисляем финальные характеристики
    v_max_health := FLOOR(v_base_health * v_rarity_mult * v_class_mult_health);
    v_max_defense := FLOOR(v_base_defense * v_rarity_mult * v_class_mult_defense);
    
    -- Обновляем характеристики, сохраняя текущее здоровье и защиту, но не превышая новые максимумы
    UPDATE public.card_instances
    SET 
      max_health = v_max_health,
      current_health = LEAST(current_health, v_max_health),
      max_defense = v_max_defense,
      current_defense = LEAST(current_defense, v_max_defense),
      updated_at = NOW()
    WHERE id = instance_rec.id;
    
    v_updated := v_updated + 1;
  END LOOP;
  
  RAISE NOTICE 'Updated % card instances with proper stats', v_updated;
END $$;