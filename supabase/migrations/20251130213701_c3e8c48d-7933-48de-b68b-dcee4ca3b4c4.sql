-- Fix create_card_instance_by_wallet to use card_templates for stats
CREATE OR REPLACE FUNCTION public.create_card_instance_by_wallet(
  p_wallet_address text,
  p_card jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_user_id uuid;
  v_card_id text := p_card->>'id';
  v_card_name text := p_card->>'name';
  v_card_faction text := p_card->>'faction';
  v_rarity integer := COALESCE((p_card->>'rarity')::integer, 1);
  v_card_type text := CASE 
    WHEN p_card->>'type' = 'pet' THEN 'dragon'
    WHEN p_card->>'type' IN ('worker','workers') THEN 'workers'
    WHEN p_card->>'type' = 'character' THEN 'hero'
    ELSE COALESCE(p_card->>'type', 'hero')
  END;
  v_template record;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  IF v_card_id IS NULL OR v_card_id = '' THEN
    RAISE EXCEPTION 'card id required';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for wallet address: %', p_wallet_address;
  END IF;

  -- Get stats from card_templates for heroes and dragons
  IF v_card_type IN ('hero', 'dragon') THEN
    SELECT power, defense, health, magic
    INTO v_template
    FROM public.card_templates
    WHERE card_name = v_card_name
      AND card_type = v_card_type
      AND rarity = v_rarity
      AND (faction = v_card_faction OR (faction IS NULL AND v_card_faction IS NULL))
    LIMIT 1;
  END IF;

  -- UPSERT ensures no duplicates are created concurrently
  INSERT INTO public.card_instances (
    user_id,
    wallet_address,
    card_template_id,
    card_type,
    current_health,
    max_health,
    current_defense,
    max_defense,
    max_power,
    max_magic,
    last_heal_time,
    card_data
  ) VALUES (
    v_user_id,
    p_wallet_address,
    v_card_id,
    v_card_type,
    COALESCE(v_template.health, 100),
    COALESCE(v_template.health, 100),
    COALESCE(v_template.defense, 0),
    COALESCE(v_template.defense, 0),
    COALESCE(v_template.power, 0),
    COALESCE(v_template.magic, 0),
    now(),
    p_card
  )
  ON CONFLICT (wallet_address, card_template_id)
  DO UPDATE SET 
    updated_at = now(),
    max_health = COALESCE(EXCLUDED.max_health, card_instances.max_health),
    max_defense = COALESCE(EXCLUDED.max_defense, card_instances.max_defense),
    max_power = COALESCE(EXCLUDED.max_power, card_instances.max_power),
    max_magic = COALESCE(EXCLUDED.max_magic, card_instances.max_magic)
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id
    FROM public.card_instances
    WHERE wallet_address = p_wallet_address
      AND card_template_id = v_card_id
    LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;