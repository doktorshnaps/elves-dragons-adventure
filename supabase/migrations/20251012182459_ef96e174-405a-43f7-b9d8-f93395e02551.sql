-- Add monster_kills column to card_instances table
ALTER TABLE public.card_instances 
ADD COLUMN IF NOT EXISTS monster_kills integer NOT NULL DEFAULT 0;

-- Create function to increment monster kills (security definer to prevent manipulation)
CREATE OR REPLACE FUNCTION public.increment_card_monster_kills(
  p_card_instance_id uuid,
  p_wallet_address text,
  p_kills_to_add integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_card_instance_id IS NULL OR p_wallet_address IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  IF p_kills_to_add < 0 THEN
    RAISE EXCEPTION 'Cannot add negative kills';
  END IF;

  -- Update monster kills for the card instance
  UPDATE public.card_instances
  SET 
    monster_kills = monster_kills + p_kills_to_add,
    updated_at = now()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN FOUND;
END;
$$;

-- Add comment
COMMENT ON COLUMN public.card_instances.monster_kills IS 'Total number of monsters killed by this card instance';
COMMENT ON FUNCTION public.increment_card_monster_kills IS 'Safely increment monster kills for a card instance';