-- Добавим логирование в функции создания card_instance
CREATE OR REPLACE FUNCTION public.create_card_instance_by_wallet(p_wallet_address text, p_card jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing uuid;
  v_new_id uuid;
  v_card_id text := p_card->>'id';
  v_card_type text := COALESCE(NULLIF(p_card->>'type',''), 'hero');
  v_health integer := COALESCE((p_card->>'health')::integer, 0);
BEGIN
  -- КРИТИЧЕСКИЙ ЛОГ: отслеживаем создание card_instances
  RAISE LOG 'WORKER_DEBUG: create_card_instance_by_wallet called for wallet=% card_id=% card_name=% card_type=%', 
    p_wallet_address, v_card_id, p_card->>'name', v_card_type;

  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  IF v_card_id IS NULL OR v_card_id = '' THEN
    RAISE EXCEPTION 'card id required';
  END IF;

  -- Try to find existing
  SELECT id INTO v_existing
  FROM public.card_instances
  WHERE wallet_address = p_wallet_address
    AND card_template_id = v_card_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE LOG 'WORKER_DEBUG: Found existing card_instance id=% for wallet=% card_id=%', v_existing, p_wallet_address, v_card_id;
    RETURN v_existing;
  END IF;

  -- Insert or do nothing if concurrent insert happened
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
  )
  ON CONFLICT (wallet_address, card_template_id) DO NOTHING
  RETURNING id INTO v_new_id;

  IF v_new_id IS NULL THEN
    -- Concurrent insert: fetch the id
    SELECT id INTO v_new_id
    FROM public.card_instances
    WHERE wallet_address = p_wallet_address
      AND card_template_id = v_card_id
    LIMIT 1;
    RAISE LOG 'WORKER_DEBUG: Retrieved concurrent insert id=% for wallet=% card_id=%', v_new_id, p_wallet_address, v_card_id;
  ELSE
    RAISE LOG 'WORKER_DEBUG: Created NEW card_instance id=% for wallet=% card_id=%', v_new_id, p_wallet_address, v_card_id;
  END IF;

  RETURN v_new_id;
END;
$$;

-- Также добавим логирование в create_worker_card_instance
CREATE OR REPLACE FUNCTION public.create_worker_card_instance(
  p_wallet_address text,
  p_worker_data jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_instance_id uuid;
  v_health integer := 100;
BEGIN
  -- КРИТИЧЕСКИЙ ЛОГ: отслеживаем создание рабочих
  RAISE LOG 'WORKER_DEBUG: create_worker_card_instance called for wallet=% worker_id=% worker_name=%', 
    p_wallet_address, p_worker_data->>'id', p_worker_data->>'name';

  -- Get user_id for the wallet
  SELECT user_id INTO v_user_id
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  -- Create card instance for worker
  INSERT INTO public.card_instances (
    user_id,
    wallet_address,
    card_template_id,
    card_type,
    current_health,
    max_health,
    card_data,
    last_heal_time
  ) VALUES (
    v_user_id,
    p_wallet_address,
    p_worker_data->>'id',
    'hero', -- Use hero type since workers type not fully supported
    v_health,
    v_health,
    p_worker_data,
    now()
  ) RETURNING id INTO v_instance_id;

  RAISE LOG 'WORKER_DEBUG: Created worker card_instance id=% for wallet=% worker_id=%', v_instance_id, p_wallet_address, p_worker_data->>'id';

  RETURN v_instance_id;
END;
$$;