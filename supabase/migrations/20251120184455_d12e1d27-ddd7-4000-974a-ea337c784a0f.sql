-- Создаем функцию для принудительной очистки NFT записей игрока
CREATE OR REPLACE FUNCTION public.force_clear_nft_cards(
  p_wallet_address TEXT,
  p_contract_id TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  -- Удаляем из user_nft_cards
  IF p_contract_id IS NOT NULL THEN
    DELETE FROM public.user_nft_cards
    WHERE wallet_address = p_wallet_address
      AND nft_contract_id = p_contract_id;
  ELSE
    DELETE FROM public.user_nft_cards
    WHERE wallet_address = p_wallet_address;
  END IF;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE LOG 'Force cleared % NFT card mappings for wallet %', v_deleted_count, p_wallet_address;
  
  RETURN v_deleted_count;
END;
$$;