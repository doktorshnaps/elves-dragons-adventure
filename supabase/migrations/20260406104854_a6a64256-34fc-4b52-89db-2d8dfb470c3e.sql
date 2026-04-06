
DROP FUNCTION IF EXISTS public.admin_create_treasure_hunt_event(text, integer, text, text, numeric, integer, integer, integer, numeric, integer);

CREATE OR REPLACE FUNCTION public.admin_create_treasure_hunt_event(
  p_admin_wallet text,
  p_item_template_id integer,
  p_item_name text,
  p_item_image_url text DEFAULT NULL,
  p_drop_chance numeric DEFAULT 5,
  p_dungeon_number integer DEFAULT NULL,
  p_total_quantity integer DEFAULT 100,
  p_max_winners integer DEFAULT 10,
  p_reward_amount numeric DEFAULT 100,
  p_duration_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not authorized');
  END IF;

  INSERT INTO treasure_hunt_events (
    item_name, item_image_url, item_template_id,
    drop_chance, dungeon_number, total_quantity,
    max_winners, reward_amount, is_active,
    started_at, ended_at, created_by_wallet_address
  ) VALUES (
    p_item_name, p_item_image_url, p_item_template_id,
    p_drop_chance, p_dungeon_number, p_total_quantity,
    p_max_winners, p_reward_amount, false,
    NULL, NULL, p_admin_wallet
  )
  RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('status', 'success', 'event_id', v_event_id);
END;
$$;
