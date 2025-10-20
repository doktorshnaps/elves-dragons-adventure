-- Add sell_price column to item_templates
ALTER TABLE public.item_templates 
ADD COLUMN IF NOT EXISTS sell_price integer DEFAULT 0;

-- Update the admin_update_item_template function to include sell_price
CREATE OR REPLACE FUNCTION public.admin_update_item_template(
  p_wallet_address text,
  p_id integer,
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
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin or super admin
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  -- Update the item template
  UPDATE public.item_templates
  SET
    item_id = p_item_id,
    name = p_name,
    type = p_type,
    rarity = p_rarity,
    description = p_description,
    source_type = p_source_type,
    image_url = p_image_url,
    slot = p_slot,
    value = p_value,
    sell_price = p_sell_price,
    level_requirement = p_level_requirement,
    drop_chance = p_drop_chance,
    updated_at = now()
  WHERE id = p_id;
END;
$$;

-- Update the admin_insert_item_template function to include sell_price
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
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin or super admin
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  -- Insert the new item template
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
  );
END;
$$;