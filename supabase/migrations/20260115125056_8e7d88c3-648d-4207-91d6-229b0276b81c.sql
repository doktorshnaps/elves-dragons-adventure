-- Drop old version with p_sell_price that returns void
DROP FUNCTION IF EXISTS public.admin_insert_item_template(text, text, text, text, text, text, text, text, text, integer, integer, integer, numeric);

-- Recreate with ON CONFLICT DO UPDATE
CREATE OR REPLACE FUNCTION public.admin_insert_item_template(
  p_wallet_address text,
  p_item_id text,
  p_name text,
  p_type text,
  p_rarity text,
  p_description text,
  p_source_type text,
  p_image_url text,
  p_slot text,
  p_value integer,
  p_sell_price integer,
  p_level_requirement integer,
  p_drop_chance numeric
)
RETURNS item_templates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result item_templates;
BEGIN
  -- Check if user is admin or super admin
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  -- Insert the new item template with ON CONFLICT DO UPDATE
  INSERT INTO public.item_templates (
    item_id,
    name,
    type,
    rarity,
    description,
    source_type,
    image_url,
    slot,
    value,
    sell_price,
    level_requirement,
    drop_chance,
    created_at,
    updated_at
  ) VALUES (
    p_item_id,
    p_name,
    p_type,
    p_rarity,
    p_description,
    p_source_type,
    p_image_url,
    p_slot,
    p_value,
    p_sell_price,
    p_level_requirement,
    p_drop_chance,
    now(),
    now()
  )
  ON CONFLICT (item_id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    rarity = EXCLUDED.rarity,
    description = EXCLUDED.description,
    source_type = EXCLUDED.source_type,
    image_url = EXCLUDED.image_url,
    slot = EXCLUDED.slot,
    value = EXCLUDED.value,
    sell_price = EXCLUDED.sell_price,
    level_requirement = EXCLUDED.level_requirement,
    drop_chance = EXCLUDED.drop_chance,
    updated_at = now()
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$function$;