-- Обновляем функцию cleanup_transferred_nft_cards для очистки всех источников NFT
CREATE OR REPLACE FUNCTION public.cleanup_transferred_nft_cards(
  p_wallet_address TEXT,
  p_current_nft_tokens JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_instances INTEGER := 0;
  v_deleted_mappings INTEGER := 0;
  v_cleaned_game_data INTEGER := 0;
BEGIN
  -- 1. Удаляем записи NFT из card_instances
  DELETE FROM public.card_instances
  WHERE wallet_address = p_wallet_address
    AND nft_contract_id IS NOT NULL
    AND nft_token_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(p_current_nft_tokens) AS token
      WHERE token->>'contract_id' = card_instances.nft_contract_id
        AND token->>'token_id' = card_instances.nft_token_id
    );
  
  GET DIAGNOSTICS v_deleted_instances = ROW_COUNT;
  
  -- 2. Удаляем записи из user_nft_cards
  DELETE FROM public.user_nft_cards
  WHERE wallet_address = p_wallet_address
    AND NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(p_current_nft_tokens) AS token
      WHERE token->>'contract_id' = user_nft_cards.nft_contract_id
        AND token->>'token_id' = user_nft_cards.nft_token_id
    );
  
  GET DIAGNOSTICS v_deleted_mappings = ROW_COUNT;
  
  -- 3. КРИТИЧНО: Очищаем NFT из game_data.cards
  UPDATE public.game_data
  SET cards = (
    SELECT COALESCE(jsonb_agg(card), '[]'::jsonb)
    FROM jsonb_array_elements(cards) AS card
    WHERE (card->>'isNFT')::boolean = false
       OR EXISTS (
         SELECT 1
         FROM jsonb_array_elements(p_current_nft_tokens) AS token
         WHERE token->>'contract_id' = card->>'nftContractId'
           AND token->>'token_id' = card->>'nftTokenId'
       )
  ),
  updated_at = now()
  WHERE wallet_address = p_wallet_address
    AND EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(cards) AS card
      WHERE (card->>'isNFT')::boolean = true
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p_current_nft_tokens) AS token
          WHERE token->>'contract_id' = card->>'nftContractId'
            AND token->>'token_id' = card->>'nftTokenId'
        )
    );
  
  GET DIAGNOSTICS v_cleaned_game_data = ROW_COUNT;
  
  IF v_deleted_instances > 0 OR v_deleted_mappings > 0 OR v_cleaned_game_data > 0 THEN
    RAISE LOG 'Cleaned up % NFT card instances, % NFT mappings, and % game_data records for wallet %', 
      v_deleted_instances, v_deleted_mappings, v_cleaned_game_data, p_wallet_address;
  END IF;
  
  RETURN v_deleted_instances + v_deleted_mappings + v_cleaned_game_data;
END;
$$;