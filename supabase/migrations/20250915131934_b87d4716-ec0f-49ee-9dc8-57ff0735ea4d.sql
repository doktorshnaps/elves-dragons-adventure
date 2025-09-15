-- Create add_card_to_medical_bay function
CREATE OR REPLACE FUNCTION public.add_card_to_medical_bay(
  p_wallet_address text,
  p_card_instance_id uuid,
  p_healing_hours integer DEFAULT 2
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_medical_bay_id uuid;
  v_estimated_completion timestamp with time zone;
BEGIN
  IF p_wallet_address IS NULL OR p_card_instance_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  -- Get user_id from game_data
  SELECT user_id INTO v_user_id
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  -- Calculate estimated completion time
  v_estimated_completion := now() + (p_healing_hours * interval '1 hour');

  -- Insert into medical_bay
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
    10, -- default heal rate
    false
  ) RETURNING id INTO v_medical_bay_id;

  -- Update card instance to mark it as in medical bay
  UPDATE public.card_instances
  SET 
    is_in_medical_bay = true,
    medical_bay_start_time = now(),
    updated_at = now()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN v_medical_bay_id;
END;
$$;

-- Create remove_card_from_medical_bay function  
CREATE OR REPLACE FUNCTION public.remove_card_from_medical_bay(
  p_card_instance_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_address text;
  v_current_user_wallet text;
BEGIN
  IF p_card_instance_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  -- Get current user's wallet
  SELECT get_current_user_wallet() INTO v_current_user_wallet;

  -- Get wallet address for the card instance
  SELECT wallet_address INTO v_wallet_address
  FROM public.card_instances
  WHERE id = p_card_instance_id;

  -- Check if user owns this card
  IF v_wallet_address IS NULL OR v_wallet_address != v_current_user_wallet THEN
    RAISE EXCEPTION 'Card not found or access denied';
  END IF;

  -- Remove from medical bay
  DELETE FROM public.medical_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = v_wallet_address;

  -- Update card instance to mark it as not in medical bay
  UPDATE public.card_instances
  SET 
    is_in_medical_bay = false,
    medical_bay_start_time = null,
    updated_at = now()
  WHERE id = p_card_instance_id
    AND wallet_address = v_wallet_address;

  RETURN FOUND;
END;
$$;