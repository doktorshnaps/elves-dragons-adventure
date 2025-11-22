-- Fix reset_shop_inventory to check next_reset_time before resetting
CREATE OR REPLACE FUNCTION public.reset_shop_inventory(p_force BOOLEAN DEFAULT FALSE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_per_refresh integer;
  v_refresh_interval_hours integer;
  v_next_reset_time timestamp with time zone;
  v_current_next_reset timestamp with time zone;
  v_should_reset boolean;
BEGIN
  -- Get current next_reset_time from shop_inventory
  SELECT next_reset_time INTO v_current_next_reset
  FROM public.shop_inventory
  ORDER BY created_at ASC
  LIMIT 1;

  -- Check if we should reset (time has passed OR forced)
  v_should_reset := p_force OR v_current_next_reset IS NULL OR now() >= v_current_next_reset;

  IF NOT v_should_reset THEN
    RAISE NOTICE 'Shop reset skipped: next reset time not reached (%, current time: %)', v_current_next_reset, now();
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Next reset time not reached',
      'next_reset_time', v_current_next_reset,
      'current_time', now()
    );
  END IF;

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

  -- Delete existing inventory with WHERE clause (required by Supabase)
  DELETE FROM public.shop_inventory WHERE true;

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
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Shop reset successfully',
    'items_per_refresh', v_items_per_refresh,
    'next_reset_time', v_next_reset_time
  );
END;
$$;