-- Create test function to damage a card for testing
CREATE OR REPLACE FUNCTION public.test_damage_card(
  p_wallet_address text,
  p_card_template_id text,
  p_damage_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_wallet_address IS NULL OR p_card_template_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  UPDATE public.card_instances
  SET 
    current_health = GREATEST(1, current_health - p_damage_amount),
    updated_at = now()
  WHERE wallet_address = p_wallet_address
    AND card_template_id = p_card_template_id;

  RETURN FOUND;
END;
$$;