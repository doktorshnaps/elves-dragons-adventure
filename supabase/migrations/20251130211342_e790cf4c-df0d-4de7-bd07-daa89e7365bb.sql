-- Create card_templates table for pre-calculated card stats
CREATE TABLE IF NOT EXISTS public.card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name text NOT NULL,
  card_type text NOT NULL CHECK (card_type IN ('hero', 'dragon')),
  rarity integer NOT NULL CHECK (rarity BETWEEN 1 AND 9),
  faction text,
  power integer NOT NULL DEFAULT 0,
  defense integer NOT NULL DEFAULT 0,
  health integer NOT NULL DEFAULT 0,
  magic integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(card_name, card_type, rarity)
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_card_templates_lookup 
ON public.card_templates(card_name, card_type, rarity);

-- RLS policies
ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view card templates"
ON public.card_templates FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert card templates"
ON public.card_templates FOR INSERT
WITH CHECK (public.is_admin_or_super_wallet(public.get_current_user_wallet()));

CREATE POLICY "Only admins can update card templates"
ON public.card_templates FOR UPDATE
USING (public.is_admin_or_super_wallet(public.get_current_user_wallet()));

CREATE POLICY "Only admins can delete card templates"
ON public.card_templates FOR DELETE
USING (public.is_admin_or_super_wallet(public.get_current_user_wallet()));

-- Function to populate card templates from existing data
CREATE OR REPLACE FUNCTION public.populate_card_templates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hero_base record;
  v_dragon_base record;
  v_rarity_mult record;
  v_class_mult record;
  v_card_mapping record;
  v_count integer := 0;
  v_power integer;
  v_defense integer;
  v_health integer;
  v_magic integer;
  v_rarity_val numeric;
  v_class_power numeric;
  v_class_defense numeric;
  v_class_health numeric;
  v_class_magic numeric;
BEGIN
  -- Get base stats
  SELECT health, defense, power, magic INTO v_hero_base 
  FROM public.hero_base_stats LIMIT 1;
  
  SELECT health, defense, power, magic INTO v_dragon_base 
  FROM public.dragon_base_stats LIMIT 1;

  -- Loop through all card mappings
  FOR v_card_mapping IN 
    SELECT DISTINCT card_name, card_type, class_name 
    FROM public.card_class_mappings
  LOOP
    -- Get class multipliers
    IF v_card_mapping.card_type = 'hero' THEN
      SELECT 
        COALESCE(power_multiplier, 1.0),
        COALESCE(defense_multiplier, 1.0),
        COALESCE(health_multiplier, 1.0),
        COALESCE(magic_multiplier, 1.0)
      INTO v_class_power, v_class_defense, v_class_health, v_class_magic
      FROM public.class_multipliers
      WHERE class_name = v_card_mapping.class_name;
      
      IF NOT FOUND THEN
        v_class_power := 1.0;
        v_class_defense := 1.0;
        v_class_health := 1.0;
        v_class_magic := 1.0;
      END IF;
    ELSE
      SELECT 
        COALESCE(power_multiplier, 1.0),
        COALESCE(defense_multiplier, 1.0),
        COALESCE(health_multiplier, 1.0),
        COALESCE(magic_multiplier, 1.0)
      INTO v_class_power, v_class_defense, v_class_health, v_class_magic
      FROM public.dragon_class_multipliers
      WHERE class_name = v_card_mapping.class_name;
      
      IF NOT FOUND THEN
        v_class_power := 1.0;
        v_class_defense := 1.0;
        v_class_health := 1.0;
        v_class_magic := 1.0;
      END IF;
    END IF;

    -- Loop through rarities 1-8
    FOR i IN 1..8 LOOP
      -- Get rarity multiplier
      SELECT COALESCE(multiplier, 1.0) INTO v_rarity_val
      FROM public.rarity_multipliers
      WHERE rarity = i;
      
      IF NOT FOUND THEN
        CASE i
          WHEN 1 THEN v_rarity_val := 1.0;
          WHEN 2 THEN v_rarity_val := 1.6;
          WHEN 3 THEN v_rarity_val := 2.4;
          WHEN 4 THEN v_rarity_val := 3.4;
          WHEN 5 THEN v_rarity_val := 4.8;
          WHEN 6 THEN v_rarity_val := 6.9;
          WHEN 7 THEN v_rarity_val := 10.0;
          WHEN 8 THEN v_rarity_val := 14.5;
          ELSE v_rarity_val := 1.0;
        END CASE;
      END IF;

      -- Calculate stats
      IF v_card_mapping.card_type = 'hero' THEN
        v_power := FLOOR(v_hero_base.power * v_rarity_val * v_class_power);
        v_defense := FLOOR(v_hero_base.defense * v_rarity_val * v_class_defense);
        v_health := FLOOR(v_hero_base.health * v_rarity_val * v_class_health);
        v_magic := FLOOR(v_hero_base.magic * v_rarity_val * v_class_magic);
      ELSE
        v_power := FLOOR(v_dragon_base.power * v_rarity_val * v_class_power);
        v_defense := FLOOR(v_dragon_base.defense * v_rarity_val * v_class_defense);
        v_health := FLOOR(v_dragon_base.health * v_rarity_val * v_class_health);
        v_magic := FLOOR(v_dragon_base.magic * v_rarity_val * v_class_magic);
      END IF;

      -- Insert or update template
      INSERT INTO public.card_templates (
        card_name, card_type, rarity, power, defense, health, magic
      )
      VALUES (
        v_card_mapping.card_name, v_card_mapping.card_type, i,
        v_power, v_defense, v_health, v_magic
      )
      ON CONFLICT (card_name, card_type, rarity) 
      DO UPDATE SET
        power = EXCLUDED.power,
        defense = EXCLUDED.defense,
        health = EXCLUDED.health,
        magic = EXCLUDED.magic,
        updated_at = now();
      
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Function to get stats from template
CREATE OR REPLACE FUNCTION public.get_card_stats_from_template(
  p_card_name text,
  p_card_type text,
  p_rarity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template record;
BEGIN
  SELECT power, defense, health, magic
  INTO v_template
  FROM public.card_templates
  WHERE card_name = p_card_name
    AND card_type = p_card_type
    AND rarity = p_rarity;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'power', 0,
      'defense', 0,
      'health', 0,
      'magic', 0,
      'error', 'Template not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'power', v_template.power,
    'defense', v_template.defense,
    'health', v_template.health,
    'magic', v_template.magic
  );
END;
$$;

-- Function to recalculate all card instances from templates
CREATE OR REPLACE FUNCTION public.recalculate_all_card_instances_from_templates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance record;
  v_template record;
  v_count integer := 0;
  v_card_data jsonb;
  v_card_name text;
  v_card_type text;
  v_rarity integer;
BEGIN
  FOR v_instance IN
    SELECT id, card_data, card_type
    FROM public.card_instances
  LOOP
    v_card_data := v_instance.card_data;
    v_card_name := v_card_data->>'name';
    v_rarity := (v_card_data->>'rarity')::integer;
    v_card_type := v_instance.card_type;

    -- Get stats from template
    SELECT power, defense, health, magic
    INTO v_template
    FROM public.card_templates
    WHERE card_name = v_card_name
      AND card_type = v_card_type
      AND rarity = v_rarity;

    IF FOUND AND v_template.power > 0 THEN
      -- Update card instance with template stats
      UPDATE public.card_instances
      SET
        max_power = v_template.power,
        max_defense = v_template.defense,
        max_health = v_template.health,
        max_magic = v_template.magic,
        current_health = LEAST(current_health, v_template.health),
        current_defense = LEAST(current_defense, v_template.defense),
        card_data = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                v_card_data,
                '{power}', to_jsonb(v_template.power)
              ),
              '{defense}', to_jsonb(v_template.defense)
            ),
            '{health}', to_jsonb(v_template.health)
          ),
          '{magic}', to_jsonb(v_template.magic)
        ),
        updated_at = now()
      WHERE id = v_instance.id;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;