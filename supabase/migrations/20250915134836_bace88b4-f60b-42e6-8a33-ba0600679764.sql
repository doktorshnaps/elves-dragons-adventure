-- Update medical bay add function to compute estimated completion based on missing HP at 1 HP/min
CREATE OR REPLACE FUNCTION public.add_card_to_medical_bay(
  p_wallet_address text,
  p_card_instance_id uuid,
  p_healing_hours integer DEFAULT 2
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_medical_bay_id uuid;
  v_estimated_completion timestamp with time zone;
  v_current_health integer;
  v_max_health integer;
  v_heal_rate integer := 1; -- 1 HP per minute
  v_missing_hp integer;
  v_minutes_needed integer;
BEGIN
  IF p_wallet_address IS NULL OR p_card_instance_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  -- Get card health
  SELECT ci.current_health, ci.max_health
  INTO v_current_health, v_max_health
  FROM public.card_instances ci
  WHERE ci.id = p_card_instance_id
    AND ci.wallet_address = p_wallet_address
  LIMIT 1;

  IF v_current_health IS NULL OR v_max_health IS NULL THEN
    RAISE EXCEPTION 'Card instance not found';
  END IF;

  v_missing_hp := GREATEST(v_max_health - v_current_health, 0);

  IF v_missing_hp = 0 THEN
    v_minutes_needed := 0;
  ELSE
    v_minutes_needed := CEIL(v_missing_hp::numeric / v_heal_rate)::int;
  END IF;

  v_estimated_completion := now() + (v_minutes_needed || ' minutes')::interval;

  -- Insert into medical_bay with calculated completion and heal rate
  INSERT INTO public.medical_bay (
    user_id,
    wallet_address,
    card_instance_id,
    estimated_completion,
    heal_rate,
    is_completed
  ) VALUES (
    v_user_id,
    p_wallet_address,
    p_card_instance_id,
    v_estimated_completion,
    v_heal_rate,
    false
  ) RETURNING id INTO v_medical_bay_id;

  -- Mark card as in medical bay and persist heal rate
  UPDATE public.card_instances
  SET 
    is_in_medical_bay = true,
    medical_bay_start_time = now(),
    medical_bay_heal_rate = v_heal_rate,
    updated_at = now()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN v_medical_bay_id;
END;
$function$;