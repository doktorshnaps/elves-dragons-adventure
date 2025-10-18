-- Safer upsert: update-by-NFT, then update-by-wallet+template, then insert
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
  -- Ensure user exists
  SELECT user_id INTO v_user_id
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for wallet: %', p_wallet_address;
  END IF;

  -- 1) Try update by NFT unique pair
  UPDATE public.card_instances
  SET 
    wallet_address = p_wallet_address,
    user_id = v_user_id,
    card_template_id = p_card_template_id,
    card_type = p_card_type,
    max_health = p_max_health,
    current_health = LEAST(current_health, p_max_health),
    card_data = p_card_data,
    updated_at = now()
  WHERE nft_contract_id = p_nft_contract_id
    AND nft_token_id = p_nft_token_id
  RETURNING id INTO v_instance_id;

  IF v_instance_id IS NOT NULL THEN
    RAISE LOG 'UPSERT_NFT: updated by NFT pair contract=% token=% wallet=% id=%', p_nft_contract_id, p_nft_token_id, p_wallet_address, v_instance_id;
    RETURN v_instance_id;
  END IF;

  -- 2) Try update by (wallet, template) unique pair
  UPDATE public.card_instances
  SET 
    nft_contract_id = p_nft_contract_id,
    nft_token_id = p_nft_token_id,
    card_type = p_card_type,
    max_health = p_max_health,
    current_health = LEAST(current_health, p_max_health),
    card_data = p_card_data,
    updated_at = now()
  WHERE wallet_address = p_wallet_address
    AND card_template_id = p_card_template_id
  RETURNING id INTO v_instance_id;

  IF v_instance_id IS NOT NULL THEN
    RAISE LOG 'UPSERT_NFT: updated by wallet+template wallet=% template=% id=%', p_wallet_address, p_card_template_id, v_instance_id;
    RETURN v_instance_id;
  END IF;

  -- 3) Insert new
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
  RETURNING id INTO v_instance_id;

  RAISE LOG 'UPSERT_NFT: inserted new contract=% token=% wallet=% id=%', p_nft_contract_id, p_nft_token_id, p_wallet_address, v_instance_id;
  RETURN v_instance_id;
END;
$function$;