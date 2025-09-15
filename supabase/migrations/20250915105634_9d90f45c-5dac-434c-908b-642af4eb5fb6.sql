-- Create RPC to safely fetch medical bay entries for a wallet, bypassing RLS via SECURITY DEFINER
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
  ci_card_data jsonb
) AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

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
    ci.card_data as ci_card_data
  FROM public.medical_bay mb
  JOIN public.card_instances ci ON ci.id = mb.card_instance_id
  WHERE mb.wallet_address = p_wallet_address
    AND mb.is_completed = false
  ORDER BY mb.placed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';