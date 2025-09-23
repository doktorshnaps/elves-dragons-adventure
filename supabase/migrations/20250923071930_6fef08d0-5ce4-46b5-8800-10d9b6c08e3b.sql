-- Обновляем существующие записи с автоматическим источником
UPDATE public.whitelist 
SET whitelist_source = 'nft_automatic', nft_contract_used = 'golden_ticket.nfts.tg'
WHERE added_by_wallet_address = 'system_nft_checker' AND whitelist_source IS NULL;

-- Функция для отзыва вайт-листа при отсутствии NFT
CREATE OR REPLACE FUNCTION public.revoke_whitelist_if_no_nft(
  p_wallet_address TEXT,
  p_nft_contracts TEXT[]
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_whitelist_record RECORD;
  v_has_qualifying_nft BOOLEAN := false;
  v_revoked_count INTEGER := 0;
BEGIN
  IF p_wallet_address IS NULL OR array_length(p_nft_contracts, 1) IS NULL THEN
    RETURN false;
  END IF;

  -- Получаем запись вайт-листа, если она была выдана автоматически за NFT
  SELECT * INTO v_whitelist_record
  FROM public.whitelist
  WHERE wallet_address = p_wallet_address
    AND whitelist_source = 'nft_automatic'
    AND is_active = true
  LIMIT 1;

  -- Если нет автоматической записи, ничего не делаем
  IF v_whitelist_record IS NULL THEN
    RETURN false;
  END IF;

  -- Проверяем каждый контракт из списка активных вайт-лист контрактов
  FOR i IN 1..array_length(p_nft_contracts, 1) LOOP
    -- Если у пользователя есть NFT из любого из контрактов
    IF EXISTS (
      SELECT 1 FROM public.whitelist_contracts 
      WHERE contract_address = p_nft_contracts[i] 
        AND is_active = true
    ) THEN
      v_has_qualifying_nft := true;
      EXIT; -- Достаточно одного совпадения
    END IF;
  END LOOP;

  -- Если квалифицирующих NFT больше нет, отзываем вайт-лист
  IF NOT v_has_qualifying_nft THEN
    UPDATE public.whitelist
    SET is_active = false,
        notes = COALESCE(notes, '') || ' [Автоматически отозван: NFT не найден]',
        updated_at = now()
    WHERE wallet_address = p_wallet_address
      AND whitelist_source = 'nft_automatic'
      AND is_active = true;
      
    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
    
    IF v_revoked_count > 0 THEN
      RAISE LOG 'Revoked NFT whitelist for wallet % - no qualifying NFTs found', p_wallet_address;
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- Обновляем функцию проверки вайт-листа NFT для включения отзыва
CREATE OR REPLACE FUNCTION public.check_and_add_to_whitelist_by_nft(
  p_wallet_address TEXT,
  p_nft_contracts TEXT[]
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_whitelist_contract RECORD;
  v_has_qualifying_nft BOOLEAN := false;
  v_used_contract TEXT;
BEGIN
  IF p_wallet_address IS NULL OR array_length(p_nft_contracts, 1) IS NULL THEN
    RETURN false;
  END IF;

  -- Проверяем каждый контракт из списка активных вайт-лист контрактов
  FOR v_whitelist_contract IN 
    SELECT contract_address 
    FROM public.whitelist_contracts 
    WHERE is_active = true
  LOOP
    -- Если у пользователя есть NFT из этого контракта
    IF v_whitelist_contract.contract_address = ANY(p_nft_contracts) THEN
      v_has_qualifying_nft := true;
      v_used_contract := v_whitelist_contract.contract_address;
      EXIT; -- Достаточно одного совпадения
    END IF;
  END LOOP;

  -- Если найден подходящий NFT, добавляем в вайт-лист
  IF v_has_qualifying_nft THEN
    INSERT INTO public.whitelist (
      wallet_address, 
      added_by_wallet_address, 
      notes,
      whitelist_source,
      nft_contract_used
    ) VALUES (
      p_wallet_address,
      'system_nft_checker',
      'Добавлен автоматически за NFT из ' || v_used_contract,
      'nft_automatic',
      v_used_contract
    )
    ON CONFLICT (wallet_address) 
    DO UPDATE SET 
      is_active = true,
      notes = 'Подтвержден автоматически за NFT из ' || v_used_contract,
      whitelist_source = 'nft_automatic',
      nft_contract_used = v_used_contract,
      updated_at = now();
      
    RETURN true;
  ELSE
    -- Если NFT нет, пытаемся отозвать автоматический вайт-лист
    PERFORM revoke_whitelist_if_no_nft(p_wallet_address, p_nft_contracts);
  END IF;

  RETURN false;
END;
$$;