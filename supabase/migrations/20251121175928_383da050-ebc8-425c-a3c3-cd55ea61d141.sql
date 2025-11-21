-- Update reset_shop_inventory function to use shop_settings
CREATE OR REPLACE FUNCTION public.reset_shop_inventory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_per_refresh integer;
  v_refresh_interval_hours integer;
  v_next_reset_time timestamp with time zone;
BEGIN
  -- Get settings from shop_settings table
  SELECT items_per_refresh, refresh_interval_hours 
  INTO v_items_per_refresh, v_refresh_interval_hours
  FROM public.shop_settings
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Use defaults if settings not found
  IF v_items_per_refresh IS NULL THEN
    v_items_per_refresh := 50;
  END IF;
  
  IF v_refresh_interval_hours IS NULL THEN
    v_refresh_interval_hours := 24;
  END IF;

  -- Calculate next reset time
  v_next_reset_time := now() + (v_refresh_interval_hours || ' hours')::interval;

  -- Delete existing inventory
  DELETE FROM public.shop_inventory;

  -- Insert fresh inventory from item_templates with configurable quantity
  INSERT INTO public.shop_inventory (item_id, available_quantity, last_reset_time, next_reset_time)
  SELECT 
    id, 
    v_items_per_refresh,
    now(),
    v_next_reset_time
  FROM public.item_templates
  WHERE source_type = 'shop';

  RAISE NOTICE 'Shop inventory reset with % items per item, next reset at %', v_items_per_refresh, v_next_reset_time;
END;
$$;