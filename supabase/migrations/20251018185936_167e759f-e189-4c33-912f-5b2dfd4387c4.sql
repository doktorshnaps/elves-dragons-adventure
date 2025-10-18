-- Добавляем поля для NFT карточек в card_instances
ALTER TABLE public.card_instances 
ADD COLUMN IF NOT EXISTS nft_contract_id TEXT,
ADD COLUMN IF NOT EXISTS nft_token_id TEXT;

-- Создаем уникальный индекс для NFT карточек (одна NFT = одна запись независимо от владельца)
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_instances_nft_unique 
ON public.card_instances(nft_contract_id, nft_token_id) 
WHERE nft_contract_id IS NOT NULL AND nft_token_id IS NOT NULL;

-- Функция для создания или обновления NFT карточки
CREATE OR REPLACE FUNCTION public.upsert_nft_card_instance(
  p_wallet_address TEXT,
  p_nft_contract_id TEXT,
  p_nft_token_id TEXT,
  p_card_template_id TEXT,
  p_card_type TEXT,
  p_max_health INTEGER,
  p_card_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_instance_id UUID;
  v_existing_record RECORD;
BEGIN
  -- Получаем user_id
  SELECT user_id INTO v_user_id
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for wallet: %', p_wallet_address;
  END IF;

  -- Проверяем, существует ли уже запись для этой NFT
  SELECT * INTO v_existing_record
  FROM public.card_instances
  WHERE nft_contract_id = p_nft_contract_id
    AND nft_token_id = p_nft_token_id
  LIMIT 1;

  IF v_existing_record IS NOT NULL THEN
    -- Запись существует - обновляем владельца если он изменился
    IF v_existing_record.wallet_address != p_wallet_address THEN
      RAISE LOG 'NFT transferred: contract=%, token=%, old_owner=%, new_owner=%', 
        p_nft_contract_id, p_nft_token_id, v_existing_record.wallet_address, p_wallet_address;
      
      UPDATE public.card_instances
      SET 
        wallet_address = p_wallet_address,
        user_id = v_user_id,
        card_data = p_card_data,
        updated_at = NOW()
      WHERE id = v_existing_record.id
      RETURNING id INTO v_instance_id;
      
      RETURN v_instance_id;
    ELSE
      -- Владелец не изменился, просто обновляем данные карты
      UPDATE public.card_instances
      SET 
        card_data = p_card_data,
        max_health = p_max_health,
        updated_at = NOW()
      WHERE id = v_existing_record.id
      RETURNING id INTO v_instance_id;
      
      RETURN v_instance_id;
    END IF;
  ELSE
    -- Создаем новую запись для NFT
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
    
    RAISE LOG 'New NFT card instance created: contract=%, token=%, owner=%', 
      p_nft_contract_id, p_nft_token_id, p_wallet_address;
    
    RETURN v_instance_id;
  END IF;
END;
$$;

-- Функция для получения NFT карточек по кошельку
CREATE OR REPLACE FUNCTION public.get_nft_card_instances_by_wallet(p_wallet_address TEXT)
RETURNS TABLE(
  id UUID,
  card_template_id TEXT,
  nft_contract_id TEXT,
  nft_token_id TEXT,
  current_health INTEGER,
  max_health INTEGER,
  monster_kills INTEGER,
  card_data JSONB,
  is_in_medical_bay BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.card_template_id,
    ci.nft_contract_id,
    ci.nft_token_id,
    ci.current_health,
    ci.max_health,
    ci.monster_kills,
    ci.card_data,
    ci.is_in_medical_bay
  FROM public.card_instances ci
  WHERE ci.wallet_address = p_wallet_address
    AND ci.nft_contract_id IS NOT NULL
    AND ci.nft_token_id IS NOT NULL;
END;
$$;

-- Функция для очистки NFT карточек, которые больше не принадлежат пользователю
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
  v_deleted_count INTEGER := 0;
BEGIN
  -- Удаляем записи NFT, которые больше не принадлежат этому кошельку
  -- (они были переданы другому владельцу)
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
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count > 0 THEN
    RAISE LOG 'Cleaned up % transferred NFT cards for wallet %', v_deleted_count, p_wallet_address;
  END IF;
  
  RETURN v_deleted_count;
END;
$$;