-- Fix parameter type for update_card_instance_health function
CREATE OR REPLACE FUNCTION public.update_card_instance_health(
  p_instance_id uuid, 
  p_wallet_address text, 
  p_current_health integer, 
  p_last_heal_time timestamp with time zone DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_instance_id IS NULL OR p_wallet_address IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  UPDATE public.card_instances
  SET 
    current_health = LEAST(GREATEST(0, p_current_health), max_health),
    last_heal_time = COALESCE(p_last_heal_time, last_heal_time),
    updated_at = now()
  WHERE id = p_instance_id
    AND wallet_address = p_wallet_address;

  RETURN FOUND;
END;
$$;