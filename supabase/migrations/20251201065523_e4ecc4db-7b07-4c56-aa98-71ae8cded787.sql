
-- Fix dragon class name from "Ординарный" to "Обычный"
UPDATE public.dragon_class_multipliers
SET class_name = 'Обычный'
WHERE class_name = 'Ординарный';

-- Create RPC function to recalculate card_templates based on base stats and multipliers
CREATE OR REPLACE FUNCTION public.recalculate_card_templates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_hero_base record;
  v_dragon_base record;
  v_hero_count integer := 0;
  v_dragon_count integer := 0;
BEGIN
  -- Get base stats
  SELECT health, defense, power, magic INTO v_hero_base FROM public.hero_base_stats LIMIT 1;
  SELECT health, defense, power, magic INTO v_dragon_base FROM public.dragon_base_stats LIMIT 1;

  -- Update hero templates
  WITH updated_heroes AS (
    UPDATE public.card_templates ct
    SET 
      health = ROUND(v_hero_base.health * rm.multiplier * cm.health_multiplier),
      defense = ROUND(v_hero_base.defense * rm.multiplier * cm.defense_multiplier),
      power = ROUND(v_hero_base.power * rm.multiplier * cm.power_multiplier),
      magic = ROUND(v_hero_base.magic * rm.multiplier * cm.magic_multiplier),
      updated_at = now()
    FROM public.rarity_multipliers rm,
         public.card_class_mappings ccm,
         public.class_multipliers cm
    WHERE ct.card_type = 'hero'
      AND ct.rarity = rm.rarity
      AND ct.card_name = ccm.card_name
      AND ccm.card_type = 'hero'
      AND ccm.class_name = cm.class_name
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_hero_count FROM updated_heroes;

  -- Update dragon templates
  WITH updated_dragons AS (
    UPDATE public.card_templates ct
    SET 
      health = ROUND(v_dragon_base.health * rm.multiplier * dcm.health_multiplier),
      defense = ROUND(v_dragon_base.defense * rm.multiplier * dcm.defense_multiplier),
      power = ROUND(v_dragon_base.power * rm.multiplier * dcm.power_multiplier),
      magic = ROUND(v_dragon_base.magic * rm.multiplier * dcm.magic_multiplier),
      updated_at = now()
    FROM public.rarity_multipliers rm,
         public.card_class_mappings ccm,
         public.dragon_class_multipliers dcm
    WHERE ct.card_type = 'dragon'
      AND ct.rarity = rm.rarity
      AND ct.card_name = ccm.card_name
      AND ccm.card_type = 'dragon'
      AND ccm.class_name = dcm.class_name
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_dragon_count FROM updated_dragons;

  RETURN v_hero_count + v_dragon_count;
END;
$$;
