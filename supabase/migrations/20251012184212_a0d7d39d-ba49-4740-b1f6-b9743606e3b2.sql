-- Recreate function with proper search_path setting for security
CREATE OR REPLACE FUNCTION increment_card_monster_kills(
  p_card_template_id text,
  p_wallet_address text,
  p_kills_to_add integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update monster_kills for the card instance matching the template_id and wallet
  UPDATE card_instances
  SET 
    monster_kills = monster_kills + p_kills_to_add,
    updated_at = now()
  WHERE card_template_id = p_card_template_id 
    AND wallet_address = p_wallet_address;
END;
$$;