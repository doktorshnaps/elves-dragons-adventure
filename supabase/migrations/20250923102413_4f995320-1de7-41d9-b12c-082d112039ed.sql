-- Update function so NFT-based whitelist entries are attributed to admin wallet
CREATE OR REPLACE FUNCTION public.check_and_add_to_whitelist_by_nft(p_wallet_address text, p_nft_contracts text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'mr_bruts.tg',
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
      added_by_wallet_address = 'mr_bruts.tg',
      updated_at = now();
      
    RETURN true;
  ELSE
    -- Если NFT нет, пытаемся отозвать автоматический вайт-лист
    PERFORM revoke_whitelist_if_no_nft(p_wallet_address, p_nft_contracts);
  END IF;

  RETURN false;
END;
$function$;

-- Normalize existing NFT auto-whitelist records so they show up in admin list
UPDATE public.whitelist
SET added_by_wallet_address = 'mr_bruts.tg',
    updated_at = now()
WHERE whitelist_source = 'nft_automatic'
  AND added_by_wallet_address IS DISTINCT FROM 'mr_bruts.tg';