-- Robust fix for duplicate key on wallet_address: avoid calling ensure_game_data_exists and use UPSERT
CREATE OR REPLACE FUNCTION public.place_card_in_medical_bay(
    p_card_instance_id UUID,
    p_wallet_address TEXT
) RETURNS JSONB AS $$
DECLARE
    v_card_instance public.card_instances%ROWTYPE;
    v_heal_rate INTEGER := 10;
    v_estimated_completion TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
    v_user_id UUID;
BEGIN
    IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
      RAISE EXCEPTION 'wallet address required';
    END IF;

    -- Получаем информацию о карте пользователя
    SELECT * INTO v_card_instance
    FROM public.card_instances 
    WHERE id = p_card_instance_id 
      AND wallet_address = p_wallet_address;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card instance not found or not owned by wallet';
    END IF;
    
    -- Проверяем, что карта не на полном здоровье
    IF v_card_instance.current_health >= v_card_instance.max_health THEN
        RAISE EXCEPTION 'Card is already at full health';
    END IF;
    
    -- Проверяем, что карта не уже в медпункте
    IF EXISTS (
        SELECT 1 FROM public.medical_bay 
        WHERE card_instance_id = p_card_instance_id 
          AND is_completed = false
    ) THEN
        RAISE EXCEPTION 'Card is already in medical bay';
    END IF;

    -- Получаем или создаем user_id безопасно через UPSERT, чтобы избежать дублей по wallet_address
    SELECT user_id INTO v_user_id 
    FROM public.game_data 
    WHERE wallet_address = p_wallet_address 
    LIMIT 1;

    IF v_user_id IS NULL THEN
      INSERT INTO public.game_data (user_id, wallet_address)
      VALUES (gen_random_uuid(), p_wallet_address)
      ON CONFLICT (wallet_address) DO UPDATE 
        SET wallet_address = EXCLUDED.wallet_address
      RETURNING public.game_data.user_id INTO v_user_id;
    END IF;

    -- Проставляем user_id в экземпляр карты, если отличается/пустой
    IF v_card_instance.user_id IS DISTINCT FROM v_user_id THEN
      UPDATE public.card_instances 
      SET user_id = v_user_id, updated_at = now()
      WHERE id = p_card_instance_id;
    END IF;

    -- Рассчитываем время завершения лечения (пока 1 минута для теста)
    v_estimated_completion := now() + INTERVAL '1 minute';
    
    -- Добавляем запись в медпункт
    INSERT INTO public.medical_bay (
        card_instance_id,
        user_id,
        wallet_address,
        heal_rate,
        estimated_completion,
        is_completed,
        placed_at
    ) VALUES (
        p_card_instance_id,
        v_user_id,
        p_wallet_address,
        v_heal_rate,
        v_estimated_completion,
        false,
        now()
    );
    
    -- Обновляем статус карты
    UPDATE public.card_instances 
    SET 
        is_in_medical_bay = true,
        medical_bay_start_time = now(),
        medical_bay_heal_rate = v_heal_rate,
        updated_at = now()
    WHERE id = p_card_instance_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'card_instance_id', p_card_instance_id,
        'heal_rate', v_heal_rate,
        'estimated_completion', v_estimated_completion
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';