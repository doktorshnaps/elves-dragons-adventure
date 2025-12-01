-- Drop and recreate get_medical_bay_entries RPC with all card_instances fields
DROP FUNCTION IF EXISTS public.get_medical_bay_entries(text);

CREATE OR REPLACE FUNCTION public.get_medical_bay_entries(p_wallet_address text)
RETURNS TABLE(
  id uuid,
  card_instance_id uuid,
  placed_at timestamptz,
  estimated_completion timestamptz,
  heal_rate integer,
  is_completed boolean,
  user_id uuid,
  wallet_address text,
  ci_id uuid,
  ci_current_health integer,
  ci_max_health integer,
  ci_current_defense integer,
  ci_max_defense integer,
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
    mb.id,
    mb.card_instance_id,
    mb.placed_at,
    mb.estimated_completion,
    mb.heal_rate,
    mb.is_completed,
    mb.user_id,
    mb.wallet_address,
    ci.id as ci_id,
    ci.current_health as ci_current_health,
    ci.max_health as ci_max_health,
    ci.current_defense as ci_current_defense,
    ci.max_defense as ci_max_defense,
    ci.max_power as ci_max_power,
    ci.max_magic as ci_max_magic,
    ci.card_data as ci_card_data
  FROM public.medical_bay mb
  JOIN public.card_instances ci ON ci.id = mb.card_instance_id
  WHERE (
    mb.wallet_address = p_wallet_address
    OR (v_user_id IS NOT NULL AND mb.user_id = v_user_id)
  )
  AND mb.is_completed = false
  ORDER BY mb.placed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';