-- Удаляем старую версию функции
DROP FUNCTION IF EXISTS public.increment_card_monster_kills(text, text, integer);

-- Создаем новую функцию для инкремента убийств монстров (для обычных и NFT карт)
CREATE OR REPLACE FUNCTION public.increment_card_monster_kills(
  p_card_template_id TEXT,
  p_wallet_address TEXT,
  p_kills_to_add INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Обновляем счетчик убийств для карты (ищем по card_template_id И wallet_address)
  UPDATE public.card_instances
  SET 
    monster_kills = monster_kills + p_kills_to_add,
    updated_at = NOW()
  WHERE card_template_id = p_card_template_id
    AND wallet_address = p_wallet_address;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count > 0 THEN
    RAISE LOG 'Incremented monster kills for card % by %', p_card_template_id, p_kills_to_add;
    RETURN TRUE;
  ELSE
    RAISE LOG 'No card instance found for template % and wallet %', p_card_template_id, p_wallet_address;
    RETURN FALSE;
  END IF;
END;
$$;

-- Функция для получения статистики NFT карточки по уникальному токену
CREATE OR REPLACE FUNCTION public.get_nft_card_stats(
  p_nft_contract_id TEXT,
  p_nft_token_id TEXT
)
RETURNS TABLE(
  current_health INTEGER,
  max_health INTEGER,
  monster_kills INTEGER,
  current_owner TEXT,
  is_in_medical_bay BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.current_health,
    ci.max_health,
    ci.monster_kills,
    ci.wallet_address AS current_owner,
    ci.is_in_medical_bay
  FROM public.card_instances ci
  WHERE ci.nft_contract_id = p_nft_contract_id
    AND ci.nft_token_id = p_nft_token_id
  LIMIT 1;
END;
$$;