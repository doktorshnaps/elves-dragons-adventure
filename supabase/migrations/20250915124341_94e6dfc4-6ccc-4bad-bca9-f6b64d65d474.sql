-- Fix medical bay healing functions to properly heal cards to full health

-- Update process_medical_bay_healing to heal cards completely when time is up
CREATE OR REPLACE FUNCTION public.process_medical_bay_healing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  medical_record RECORD;
  v_healed_amount integer;
  v_new_health integer;
BEGIN
  -- Обрабатываем все активные записи в медпункте где время лечения истекло
  FOR medical_record IN 
    SELECT mb.*, ci.current_health, ci.max_health
    FROM public.medical_bay mb
    JOIN public.card_instances ci ON ci.id = mb.card_instance_id
    WHERE mb.is_completed = false
      AND mb.estimated_completion <= now()
  LOOP
    -- Полное восстановление здоровья до максимума
    v_new_health := medical_record.max_health;
    v_healed_amount := v_new_health - medical_record.current_health;
    
    -- Обновляем здоровье карты до максимума
    UPDATE public.card_instances
    SET current_health = medical_record.max_health,
        is_in_medical_bay = false,
        medical_bay_start_time = null,
        medical_bay_heal_rate = 1,
        last_heal_time = now(),
        updated_at = now()
    WHERE id = medical_record.card_instance_id;
    
    -- Помечаем лечение как завершенное
    UPDATE public.medical_bay
    SET is_completed = true,
        updated_at = now()
    WHERE id = medical_record.id;
  END LOOP;
END;
$$;

-- Update remove_card_from_medical_bay to heal cards to full health when manually removed
CREATE OR REPLACE FUNCTION public.remove_card_from_medical_bay(p_card_instance_id uuid, p_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_medical_entry RECORD;
    v_card_instance RECORD;
    v_healed_amount INTEGER;
    v_new_health INTEGER;
    v_result JSONB;
    v_time_elapsed_minutes NUMERIC;
    v_calculated_healing INTEGER;
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
    
    -- Рассчитываем время, прошедшее с начала лечения (в минутах)
    v_time_elapsed_minutes := EXTRACT(EPOCH FROM (now() - v_medical_entry.placed_at)) / 60;
    
    -- Рассчитываем сколько здоровья восстановилось за это время (10 HP/мин)
    v_calculated_healing := FLOOR(v_time_elapsed_minutes * v_medical_entry.heal_rate);
    
    -- Если время лечения истекло или карта должна быть полностью вылечена, восстанавливаем до максимума
    IF now() >= v_medical_entry.estimated_completion THEN
        v_new_health := v_card_instance.max_health;
        v_healed_amount := v_new_health - v_card_instance.current_health;
    ELSE
        -- Иначе восстанавливаем только то, что успело восстановиться
        v_healed_amount := LEAST(
            v_calculated_healing,
            v_card_instance.max_health - v_card_instance.current_health
        );
        v_new_health := v_card_instance.current_health + v_healed_amount;
    END IF;
    
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
        'max_health', v_card_instance.max_health,
        'was_fully_healed', (v_new_health = v_card_instance.max_health),
        'time_elapsed_minutes', v_time_elapsed_minutes
    );
    
    RETURN v_result;
END;
$$;