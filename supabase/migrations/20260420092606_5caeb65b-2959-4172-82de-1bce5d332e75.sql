-- 1. Add duration_seconds column
ALTER TABLE public.treasure_hunt_events
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- 2. Drop both old overloads of admin_create_treasure_hunt_event
DROP FUNCTION IF EXISTS public.admin_create_treasure_hunt_event(text, integer, text, text, numeric, integer, integer, integer, numeric, integer);
DROP FUNCTION IF EXISTS public.admin_create_treasure_hunt_event(text, integer, text, text, text, integer, numeric, integer, integer, integer, timestamp with time zone);

-- 3. Single new version with days/hours/minutes
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
  p_duration_days integer DEFAULT 0,
  p_duration_hours integer DEFAULT 0,
  p_duration_minutes integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_total_seconds integer;
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not authorized');
  END IF;

  v_total_seconds := COALESCE(p_duration_days, 0) * 86400
                   + COALESCE(p_duration_hours, 0) * 3600
                   + COALESCE(p_duration_minutes, 0) * 60;

  IF v_total_seconds <= 0 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'duration_required');
  END IF;

  INSERT INTO public.treasure_hunt_events (
    item_template_id, item_name, item_image_url,
    monster_id, dungeon_number, drop_chance,
    total_quantity, max_winners, reward_amount,
    is_active, started_at, ended_at,
    created_by_wallet_address, duration_seconds
  ) VALUES (
    p_item_template_id, p_item_name, p_item_image_url,
    p_monster_id, p_dungeon_number, p_drop_chance,
    p_total_quantity, p_max_winners, p_reward_amount,
    false, NULL, NULL,
    p_admin_wallet, v_total_seconds
  )
  RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('status', 'success', 'event_id', v_event_id);
END;
$$;

-- 4. Toggle: compute ended_at from duration_seconds at activation
CREATE OR REPLACE FUNCTION public.admin_toggle_treasure_hunt_event(
  p_admin_wallet text,
  p_event_id uuid,
  p_activate boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration integer;
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not authorized');
  END IF;

  IF p_activate THEN
    -- Get duration for the event being activated
    SELECT duration_seconds INTO v_duration
    FROM public.treasure_hunt_events
    WHERE id = p_event_id;

    IF v_duration IS NULL OR v_duration <= 0 THEN
      -- Fallback for legacy rows without duration: 7 days
      v_duration := 7 * 86400;
    END IF;

    -- Deactivate other active events (do not overwrite their original ended_at)
    UPDATE public.treasure_hunt_events
       SET is_active = false
     WHERE is_active = true
       AND id <> p_event_id;

    -- Activate this event: timer starts now
    UPDATE public.treasure_hunt_events
       SET is_active = true,
           started_at = now(),
           ended_at = now() + (v_duration || ' seconds')::interval
     WHERE id = p_event_id;
  ELSE
    -- Stop: just deactivate, keep ended_at as historical deadline
    UPDATE public.treasure_hunt_events
       SET is_active = false
     WHERE id = p_event_id;
  END IF;

  RETURN jsonb_build_object('status', 'success');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_treasure_hunt_event(text, integer, text, text, text, integer, numeric, integer, integer, integer, integer, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_treasure_hunt_event(text, uuid, boolean) TO anon, authenticated;