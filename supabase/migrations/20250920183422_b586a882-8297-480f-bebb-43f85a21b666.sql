-- Исправляем функцию create_card_instance_by_wallet для правильного определения типа рабочих карт
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
  v_card_type text := CASE 
    WHEN p_card->>'type' = 'pet' THEN 'dragon'
    WHEN p_card->>'type' = 'worker' OR p_card->>'type' = 'workers' THEN 'workers'
    ELSE 'hero'
  END;
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

  -- Check if this card instance already exists (prevent duplicates)
  SELECT id INTO v_existing
  FROM public.card_instances
  WHERE wallet_address = p_wallet_address 
    AND card_template_id = v_card_id;

  IF v_existing IS NOT NULL THEN
    RAISE LOG 'WORKER_DEBUG: Found existing card_instance id=% for wallet=% card_id=%', v_existing, p_wallet_address, v_card_id;
    RETURN v_existing;
  END IF;

  -- Create new card instance with ПРАВИЛЬНЫМ типом
  INSERT INTO public.card_instances (
    wallet_address,
    card_template_id,
    card_type,  -- Теперь правильно определяется из v_card_type
    current_health,
    max_health,
    last_heal_time,
    card_data
  ) VALUES (
    p_wallet_address,
    v_card_id,
    v_card_type,  -- workers будет правильно установлен как 'workers'
    v_health,
    v_health,
    now(),
    p_card
  ) RETURNING id INTO v_new_id;

  RAISE LOG 'WORKER_DEBUG: Created NEW card_instance id=% for wallet=% card_id=%', v_new_id, p_wallet_address, v_card_id;
  RETURN v_new_id;
END;
$$;