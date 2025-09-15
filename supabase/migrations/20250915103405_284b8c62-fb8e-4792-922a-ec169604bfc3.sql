-- Fix: ensure NOT NULL user_id when inserting into medical_bay and set search_path
CREATE OR REPLACE FUNCTION public.place_card_in_medical_bay(
    p_card_instance_id UUID,
    p_wallet_address TEXT
) RETURNS JSONB AS $$
DECLARE
    v_card_instance RECORD;
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

    -- Гарантируем существование user_id и проставляем его, если был NULL
    v_user_id := COALESCE(v_card_instance.user_id, public.ensure_game_data_exists(p_wallet_address));
    IF v_card_instance.user_id IS NULL THEN
      UPDATE public.card_instances 
      SET user_id = v_user_id, updated_at = now()
      WHERE id = p_card_instance_id;
    END IF;
    
    -- Рассчитываем время завершения лечения (пока 1 минута для теста)
    v_estimated_completion := now() + INTERVAL '1 minute';
    
    -- Добавляем запись в медпункт (user_id теперь точно не NULL)
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

-- Ensure remove_card_from_medical_bay has proper search_path as well
CREATE OR REPLACE FUNCTION public.remove_card_from_medical_bay(
    p_card_instance_id UUID,
    p_wallet_address TEXT
) RETURNS JSONB AS $$
DECLARE
    v_medical_entry RECORD;
    v_card_instance RECORD;
    v_healed_amount INTEGER;
    v_new_health INTEGER;
    v_result JSONB;
BEGIN
    -- Получаем запись из медпункта
    SELECT * INTO v_medical_entry
    FROM public.medical_bay 
    WHERE card_instance_id = p_card_instance_id 
      AND wallet_address = p_wallet_address
      AND is_completed = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Medical bay entry not found';
    END IF;
    
    -- Получаем информацию о карте
    SELECT * INTO v_card_instance
    FROM public.card_instances 
    WHERE id = p_card_instance_id;
    
    -- Рассчитываем количество восстановленного здоровья (минимум между heal_rate и нехватающим HP)
    v_healed_amount := LEAST(
        v_medical_entry.heal_rate,
        v_card_instance.max_health - v_card_instance.current_health
    );
    
    v_new_health := v_card_instance.current_health + v_healed_amount;
    
    -- Обновляем здоровье карты
    UPDATE public.card_instances 
    SET 
        current_health = v_new_health,
        last_heal_time = now(),
        is_in_medical_bay = false,
        medical_bay_start_time = null,
        medical_bay_heal_rate = 1,
        updated_at = now()
    WHERE id = p_card_instance_id;
    
    -- Помечаем запись в медпункте как завершенную
    UPDATE public.medical_bay 
    SET is_completed = true, updated_at = now()
    WHERE card_instance_id = p_card_instance_id 
      AND is_completed = false;
    
    v_result := jsonb_build_object(
        'success', true,
        'healed_amount', v_healed_amount,
        'new_health', v_new_health,
        'max_health', v_card_instance.max_health
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';