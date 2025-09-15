-- RPC to create card instance for a wallet
CREATE OR REPLACE FUNCTION public.create_card_instance_by_wallet(
  p_wallet_address text,
  p_card jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_existing uuid;
  v_new_id uuid;
  v_card_id text := p_card->>'id';
  v_card_type text := COALESCE(NULLIF(p_card->>'type',''), 'hero');
  v_health integer := COALESCE((p_card->>'health')::integer, 0);
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  IF v_card_id IS NULL OR v_card_id = '' THEN
    RAISE EXCEPTION 'card id required';
  END IF;

  SELECT id INTO v_existing
  FROM public.card_instances
  WHERE wallet_address = p_wallet_address
    AND card_template_id = v_card_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.card_instances (
    wallet_address,
    user_id,
    card_template_id,
    card_type,
    current_health,
    max_health,
    last_heal_time,
    card_data
  ) VALUES (
    p_wallet_address,
    NULL,
    v_card_id,
    CASE WHEN v_card_type = 'pet' THEN 'dragon' ELSE 'hero' END,
    v_health,
    v_health,
    now(),
    p_card
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- RPC to remove card instance by wallet and card template id
CREATE OR REPLACE FUNCTION public.remove_card_instance_by_wallet(
  p_wallet_address text,
  p_card_template_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted integer;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 OR p_card_template_id IS NULL OR p_card_template_id = '' THEN
    RAISE EXCEPTION 'invalid parameters';
  END IF;

  DELETE FROM public.card_instances
  WHERE wallet_address = p_wallet_address
    AND card_template_id = p_card_template_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;