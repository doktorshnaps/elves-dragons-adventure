-- 1) Remove existing duplicates to allow unique index
WITH ranked AS (
  SELECT 
    id,
    wallet_address,
    card_template_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY wallet_address, card_template_id 
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.card_instances
)
DELETE FROM public.card_instances ci
USING ranked r
WHERE ci.id = r.id
  AND r.rn > 1;

-- 2) Enforce uniqueness to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM   pg_indexes 
    WHERE  schemaname = 'public' 
    AND    indexname = 'uniq_card_instances_wallet_template'
  ) THEN
    CREATE UNIQUE INDEX uniq_card_instances_wallet_template 
      ON public.card_instances (wallet_address, card_template_id);
  END IF;
END $$;

-- 3) Make create_card_instance_by_wallet strictly idempotent via UPSERT
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
  v_card_type text := CASE 
    WHEN p_card->>'type' = 'pet' THEN 'dragon'
    WHEN p_card->>'type' IN ('worker','workers') THEN 'workers'
    ELSE 'hero'
  END;
  v_health integer := COALESCE((p_card->>'health')::integer, 0);
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

  -- UPSERT ensures no duplicates are created concurrently
  INSERT INTO public.card_instances (
    user_id,
    wallet_address,
    card_template_id,
    card_type,
    current_health,
    max_health,
    last_heal_time,
    card_data
  ) VALUES (
    v_user_id,
    p_wallet_address,
    v_card_id,
    v_card_type,
    v_health,
    v_health,
    now(),
    p_card
  )
  ON CONFLICT (wallet_address, card_template_id)
  DO UPDATE SET updated_at = now()
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

-- 4) Harden sync_card_instances_from_game_data with UPSERT and proper health handling
DROP FUNCTION IF EXISTS public.sync_card_instances_from_game_data(text);
CREATE OR REPLACE FUNCTION public.sync_card_instances_from_game_data(p_wallet_address text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_game_data RECORD;
  v_card_json jsonb;
  v_synced_count integer := 0;
  v_card_type text;
  v_max_health integer;
  v_current_health integer;
  v_inserted boolean;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  SELECT * INTO v_game_data 
  FROM public.game_data 
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_game_data IS NULL THEN
    RAISE EXCEPTION 'Game data not found for wallet: %', p_wallet_address;
  END IF;

  FOR v_card_json IN SELECT * FROM jsonb_array_elements(COALESCE(v_game_data.cards, '[]'::jsonb))
  LOOP
    v_card_type := CASE 
      WHEN v_card_json->>'type' = 'pet' THEN 'dragon'
      WHEN v_card_json->>'type' IN ('worker','workers') THEN 'workers'
      ELSE 'hero' 
    END;

    v_max_health := COALESCE((v_card_json->>'health')::integer, 100);
    v_current_health := COALESCE((v_card_json->>'currentHealth')::integer, v_max_health);
    v_current_health := LEAST(v_current_health, v_max_health);

    WITH upsert AS (
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
        v_game_data.user_id,
        v_card_json->>'id',
        v_card_type,
        v_current_health,
        v_max_health,
        COALESCE(to_timestamp((v_card_json->>'lastHealTime')::bigint / 1000.0), now()),
        v_card_json
      )
      ON CONFLICT (wallet_address, card_template_id)
      DO UPDATE SET 
        max_health = EXCLUDED.max_health,
        current_health = LEAST(public.card_instances.current_health, EXCLUDED.max_health),
        last_heal_time = COALESCE(public.card_instances.last_heal_time, EXCLUDED.last_heal_time),
        card_data = EXCLUDED.card_data,
        updated_at = now()
      RETURNING (xmax = 0) AS inserted
    )
    SELECT inserted INTO v_inserted FROM upsert;

    IF v_inserted THEN
      v_synced_count := v_synced_count + 1;
    END IF;
  END LOOP;

  RETURN v_synced_count;
END;
$$;