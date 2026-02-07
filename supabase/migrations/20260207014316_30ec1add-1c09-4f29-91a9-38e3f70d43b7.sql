-- Fix race condition in admin_give_player_card using advisory lock
CREATE OR REPLACE FUNCTION public.admin_give_player_card(
  p_target_wallet_address text,
  p_card_template_id text,
  p_card_data jsonb,
  p_admin_wallet_address text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_id uuid;
  v_rarity int;
  v_card_type text;
  v_idempotency_key text;
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_rarity := COALESCE((p_card_data->>'rarity')::int, 1);
  v_card_type := COALESCE(p_card_data->>'type', 'character');
  v_idempotency_key := p_card_data->>'id';

  -- Acquire advisory lock to prevent race condition on duplicate insert
  IF v_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_target_wallet_address || '::' || v_idempotency_key));
    
    -- Check for existing card with same idempotency key
    SELECT id INTO v_card_id
    FROM public.card_instances
    WHERE wallet_address = p_target_wallet_address
      AND (card_data->>'id') = v_idempotency_key
    LIMIT 1;
    
    IF v_card_id IS NOT NULL THEN
      RETURN v_card_id;
    END IF;
  END IF;

  INSERT INTO public.card_instances (
    wallet_address,
    card_template_id,
    card_type,
    card_data,
    max_power,
    max_defense,
    max_health,
    current_health,
    current_defense,
    max_magic
  ) VALUES (
    p_target_wallet_address,
    p_card_template_id,
    v_card_type,
    p_card_data,
    COALESCE((p_card_data->>'power')::int, 0),
    COALESCE((p_card_data->>'defense')::int, 0),
    COALESCE((p_card_data->>'health')::int, 0),
    COALESCE((p_card_data->>'health')::int, 0),
    COALESCE((p_card_data->>'defense')::int, 0),
    COALESCE((p_card_data->>'magic')::int, 0)
  )
  RETURNING id INTO v_card_id;

  RETURN v_card_id;
END;
$$;

-- Clean up latest duplicates
DELETE FROM card_instances
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY (card_data::jsonb)->>'id' ORDER BY created_at ASC) as rn
    FROM card_instances
    WHERE (card_data::jsonb)->>'id' LIKE 'admin-%'
  ) sub
  WHERE rn > 1
);