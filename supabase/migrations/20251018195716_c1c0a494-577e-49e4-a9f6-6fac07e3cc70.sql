-- Обновляем функцию upsert_nft_card_instance для корректной обработки конфликтов
CREATE OR REPLACE FUNCTION public.upsert_nft_card_instance(
  p_wallet_address text,
  p_nft_contract_id text,
  p_nft_token_id text,
  p_card_template_id text,
  p_card_type text,
  p_max_health integer,
  p_card_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_instance_id UUID;
BEGIN
  -- Получаем user_id
  SELECT user_id INTO v_user_id
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for wallet: %', p_wallet_address;
  END IF;

  -- Используем INSERT ... ON CONFLICT для корректного upsert
  -- Проверяем оба возможных constraint: по NFT и по wallet+template
  INSERT INTO public.card_instances (
    wallet_address,
    user_id,
    card_template_id,
    card_type,
    nft_contract_id,
    nft_token_id,
    current_health,
    max_health,
    card_data,
    monster_kills
  ) VALUES (
    p_wallet_address,
    v_user_id,
    p_card_template_id,
    p_card_type,
    p_nft_contract_id,
    p_nft_token_id,
    p_max_health,
    p_max_health,
    p_card_data,
    0
  )
  ON CONFLICT (nft_contract_id, nft_token_id) 
  DO UPDATE SET
    wallet_address = EXCLUDED.wallet_address,
    user_id = EXCLUDED.user_id,
    card_data = EXCLUDED.card_data,
    max_health = EXCLUDED.max_health,
    current_health = LEAST(card_instances.current_health, EXCLUDED.max_health),
    card_type = EXCLUDED.card_type,
    updated_at = NOW()
  RETURNING id INTO v_instance_id;

  -- Если конфликт был по (wallet_address, card_template_id), обновляем отдельно
  IF v_instance_id IS NULL THEN
    UPDATE public.card_instances
    SET
      nft_contract_id = p_nft_contract_id,
      nft_token_id = p_nft_token_id,
      card_data = p_card_data,
      max_health = p_max_health,
      current_health = LEAST(current_health, p_max_health),
      card_type = p_card_type,
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address
      AND card_template_id = p_card_template_id
    RETURNING id INTO v_instance_id;
  END IF;

  RAISE LOG 'NFT card instance upserted: contract=%, token=%, owner=%, instance_id=%', 
    p_nft_contract_id, p_nft_token_id, p_wallet_address, v_instance_id;

  RETURN v_instance_id;
END;
$function$;