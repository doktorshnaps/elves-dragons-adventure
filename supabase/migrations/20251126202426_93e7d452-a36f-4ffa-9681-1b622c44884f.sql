CREATE OR REPLACE FUNCTION public.recalculate_all_card_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card record;
  v_card_class text;
  v_rarity integer;
  v_card_type text;
  v_hero_base record;
  v_dragon_base record;
  v_base_health integer;
  v_base_defense integer;
  v_base_power integer;
  v_base_magic integer;
  v_rarity_mult numeric;
  v_class_mult_health numeric;
  v_class_mult_defense numeric;
  v_class_mult_power numeric;
  v_class_mult_magic numeric;
  v_max_health integer;
  v_max_defense integer;
  v_max_power integer;
  v_max_magic integer;
  v_total_updated integer := 0;
  v_heroes_updated integer := 0;
  v_dragons_updated integer := 0;
  v_workers_skipped integer := 0;
BEGIN
  SELECT * INTO v_hero_base FROM public.hero_base_stats LIMIT 1;
  SELECT * INTO v_dragon_base FROM public.dragon_base_stats LIMIT 1;
  
  FOR v_card IN 
    SELECT id, card_type, card_data, current_health, current_defense
    FROM public.card_instances
    WHERE card_type IN ('hero', 'dragon')
  LOOP
    v_card_type := v_card.card_type;
    v_card_class := v_card.card_data->>'cardClass';
    v_rarity := COALESCE((v_card.card_data->>'rarity')::integer, 1);
    
    IF v_card_type = 'workers' THEN
      v_workers_skipped := v_workers_skipped + 1;
      CONTINUE;
    END IF;
    
    IF v_card_type = 'hero' THEN
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
    
    SELECT multiplier INTO v_rarity_mult FROM public.rarity_multipliers WHERE rarity = v_rarity LIMIT 1;
    v_rarity_mult := COALESCE(v_rarity_mult, 1.0);
    
    IF v_card_type = 'hero' THEN
      SELECT health_multiplier, defense_multiplier, power_multiplier, magic_multiplier
      INTO v_class_mult_health, v_class_mult_defense, v_class_mult_power, v_class_mult_magic
      FROM public.class_multipliers WHERE class_name = v_card_class LIMIT 1;
    ELSE
      SELECT health_multiplier, defense_multiplier, power_multiplier, magic_multiplier
      INTO v_class_mult_health, v_class_mult_defense, v_class_mult_power, v_class_mult_magic
      FROM public.dragon_class_multipliers WHERE class_name = v_card_class LIMIT 1;
    END IF;
    
    v_class_mult_health := COALESCE(v_class_mult_health, 1.0);
    v_class_mult_defense := COALESCE(v_class_mult_defense, 1.0);
    v_class_mult_power := COALESCE(v_class_mult_power, 1.0);
    v_class_mult_magic := COALESCE(v_class_mult_magic, 1.0);
    
    v_max_health := FLOOR(v_base_health * v_rarity_mult * v_class_mult_health);
    v_max_defense := FLOOR(v_base_defense * v_rarity_mult * v_class_mult_defense);
    v_max_power := FLOOR(v_base_power * v_rarity_mult * v_class_mult_power);
    v_max_magic := FLOOR(v_base_magic * v_rarity_mult * v_class_mult_magic);
    
    UPDATE public.card_instances
    SET
      max_health = v_max_health,
      current_health = LEAST(v_card.current_health, v_max_health),
      max_defense = v_max_defense,
      current_defense = LEAST(v_card.current_defense, v_max_defense),
      max_power = v_max_power,
      max_magic = v_max_magic,
      card_data = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(card_data, '{health}', to_jsonb(v_max_health)),
            '{defense}', to_jsonb(v_max_defense)
          ),
          '{power}', to_jsonb(v_max_power)
        ),
        '{magic}', to_jsonb(v_max_magic)
      ),
      updated_at = now()
    WHERE id = v_card.id;
    
    v_total_updated := v_total_updated + 1;
    IF v_card_type = 'hero' THEN
      v_heroes_updated := v_heroes_updated + 1;
    ELSE
      v_dragons_updated := v_dragons_updated + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_updated', v_total_updated,
    'heroes_updated', v_heroes_updated,
    'dragons_updated', v_dragons_updated,
    'workers_skipped', v_workers_skipped
  );
END;
$$;