
CREATE OR REPLACE FUNCTION public.admin_create_treasure_hunt_event(
  p_admin_wallet text,
  p_item_template_id integer,
  p_item_name text,
  p_item_image_url text DEFAULT NULL,
  p_monster_id text DEFAULT NULL,
  p_dungeon_number integer DEFAULT NULL,
  p_drop_chance numeric DEFAULT 1.0,
  p_total_quantity integer DEFAULT 100,
  p_max_winners integer DEFAULT 10,
  p_reward_amount integer DEFAULT 1000,
  p_ended_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  -- Check admin rights
  IF NOT is_admin_or_super_wallet(p_admin_wallet) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not an admin');
  END IF;

  INSERT INTO treasure_hunt_events (
    item_template_id, item_name, item_image_url,
    monster_id, dungeon_number, drop_chance,
    total_quantity, max_winners, reward_amount,
    created_by_wallet_address, ended_at
  ) VALUES (
    p_item_template_id, p_item_name, p_item_image_url,
    p_monster_id, p_dungeon_number, p_drop_chance,
    p_total_quantity, p_max_winners, p_reward_amount,
    p_admin_wallet, p_ended_at
  )
  RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('status', 'ok', 'event_id', v_event_id);
END;
$$;
