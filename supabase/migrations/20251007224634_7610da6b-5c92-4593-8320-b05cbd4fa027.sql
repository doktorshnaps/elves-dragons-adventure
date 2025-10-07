-- Исправляем функцию отзыва вайт-листа при отсутствии NFT
CREATE OR REPLACE FUNCTION public.revoke_whitelist_if_no_nft(
  p_wallet_address TEXT,
  p_nft_contracts TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_whitelist_record RECORD;
  v_revoked_count INTEGER := 0;
BEGIN
  IF p_wallet_address IS NULL THEN
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

  -- КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Если массив p_nft_contracts пустой или NULL - отзываем вайт-лист
  -- Пустой массив означает что у пользователя НЕТ NFT из активных контрактов
  IF p_nft_contracts IS NULL OR array_length(p_nft_contracts, 1) IS NULL OR array_length(p_nft_contracts, 1) = 0 THEN
    UPDATE public.whitelist
    SET is_active = false,
        notes = COALESCE(notes, '') || ' [Автоматически отозван: NFT не найден]',
        updated_at = now()
    WHERE wallet_address = p_wallet_address
      AND whitelist_source = 'nft_automatic'
      AND is_active = true;
      
    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
    
    IF v_revoked_count > 0 THEN
      RAISE LOG 'Revoked NFT whitelist for wallet % - no qualifying NFTs found (empty contracts array)', p_wallet_address;
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;