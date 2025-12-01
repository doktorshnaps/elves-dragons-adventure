-- Update get_forge_bay_entries to include max_power and max_magic
DROP FUNCTION IF EXISTS public.get_forge_bay_entries(text);

CREATE OR REPLACE FUNCTION public.get_forge_bay_entries(p_wallet_address text)
RETURNS TABLE(
  id uuid,
  card_instance_id uuid,
  placed_at timestamptz,
  estimated_completion timestamptz,
  repair_rate integer,
  is_completed boolean,
  user_id uuid,
  wallet_address text,
  ci_id uuid,
  ci_current_defense integer,
  ci_max_defense integer,
  ci_current_health integer,
  ci_max_health integer,
  ci_max_power integer,
  ci_max_magic integer,
  ci_card_data jsonb
) AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Try to resolve user_id by wallet
  SELECT gd.user_id INTO v_user_id
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;

  RETURN QUERY
  SELECT
    fb.id,
    fb.card_instance_id,
    fb.placed_at,
    fb.estimated_completion,
    fb.repair_rate,
    fb.is_completed,
    fb.user_id,
    fb.wallet_address,
    ci.id as ci_id,
    ci.current_defense as ci_current_defense,
    ci.max_defense as ci_max_defense,
    ci.current_health as ci_current_health,
    ci.max_health as ci_max_health,
    ci.max_power as ci_max_power,
    ci.max_magic as ci_max_magic,
    ci.card_data as ci_card_data
  FROM public.forge_bay fb
  JOIN public.card_instances ci ON ci.id = fb.card_instance_id
  WHERE (
    fb.wallet_address = p_wallet_address
    OR (v_user_id IS NOT NULL AND fb.user_id = v_user_id)
  )
  AND fb.is_completed = false
  ORDER BY fb.placed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';