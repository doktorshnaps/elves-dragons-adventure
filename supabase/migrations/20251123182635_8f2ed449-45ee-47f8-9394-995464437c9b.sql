-- =====================================================
-- PHASE 4: SHOP DATA OPTIMIZATION
-- Consolidate 7 shop queries into single atomic RPC call
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_shop_data_complete(p_wallet_address TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_shop_inventory JSONB;
  v_user_balance NUMERIC;
  v_item_instances JSONB;
  v_item_templates JSONB;
  v_user_profile JSONB;
  v_purchase_history JSONB;
  v_shop_settings JSONB;
BEGIN
  -- 1. Get shop inventory with item templates
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', si.id,
      'item_id', si.item_id,
      'available_quantity', si.available_quantity,
      'last_reset_time', si.last_reset_time,
      'next_reset_time', si.next_reset_time,
      'item_template', jsonb_build_object(
        'id', it.id,
        'item_id', it.item_id,
        'name', it.name,
        'description', it.description,
        'type', it.type,
        'value', it.value,
        'sell_price', it.sell_price,
        'image_url', it.image_url,
        'stats', it.stats,
        'level_requirement', it.level_requirement,
        'slot', it.slot,
        'rarity', it.rarity
      )
    )
  ) INTO v_shop_inventory
  FROM shop_inventory si
  LEFT JOIN item_templates it ON si.item_id = it.id
  WHERE it.source_type = 'shop'
  ORDER BY si.item_id;

  -- 2. Get user balance
  SELECT balance INTO v_user_balance
  FROM game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  -- 3. Get user item instances (inventory counts)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ii.id,
      'template_id', ii.template_id,
      'item_id', ii.item_id,
      'name', ii.name,
      'type', ii.type,
      'created_at', ii.created_at
    )
  ) INTO v_item_instances
  FROM item_instances ii
  WHERE ii.wallet_address = p_wallet_address;

  -- 4. Get all item templates (for reference)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', it.id,
      'item_id', it.item_id,
      'name', it.name,
      'description', it.description,
      'type', it.type,
      'value', it.value,
      'sell_price', it.sell_price,
      'image_url', it.image_url,
      'stats', it.stats,
      'level_requirement', it.level_requirement,
      'slot', it.slot,
      'rarity', it.rarity
    )
  ) INTO v_item_templates
  FROM item_templates it
  WHERE it.source_type = 'shop';

  -- 5. Get user profile
  SELECT jsonb_build_object(
    'id', p.id,
    'user_id', p.user_id,
    'wallet_address', p.wallet_address,
    'display_name', p.display_name,
    'created_at', p.created_at
  ) INTO v_user_profile
  FROM profiles p
  WHERE p.wallet_address = p_wallet_address
  LIMIT 1;

  -- 6. Get purchase history (last 50 purchases)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ii.id,
      'template_id', ii.template_id,
      'created_at', ii.created_at
    )
  ) INTO v_purchase_history
  FROM item_instances ii
  WHERE ii.wallet_address = p_wallet_address
  ORDER BY ii.created_at DESC
  LIMIT 50;

  -- 7. Get shop settings
  SELECT jsonb_build_object(
    'items_per_refresh', ss.items_per_refresh,
    'refresh_interval_hours', ss.refresh_interval_hours,
    'is_open_access', ss.is_open_access
  ) INTO v_shop_settings
  FROM shop_settings ss
  WHERE ss.singleton = true
  LIMIT 1;

  -- Build final result
  v_result := jsonb_build_object(
    'shop_inventory', COALESCE(v_shop_inventory, '[]'::jsonb),
    'user_balance', COALESCE(v_user_balance, 0),
    'user_inventory', COALESCE(v_item_instances, '[]'::jsonb),
    'item_templates', COALESCE(v_item_templates, '[]'::jsonb),
    'user_profile', v_user_profile,
    'purchase_history', COALESCE(v_purchase_history, '[]'::jsonb),
    'shop_settings', v_shop_settings
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_shop_data_complete(TEXT) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_shop_data_complete(TEXT) IS 'Phase 4: Consolidates 7 shop-related queries into single atomic call. Returns all shop data including inventory, user balance, item instances, templates, profile, purchase history, and settings.';