-- Improve process_medical_bay_healing to handle multiple cards more reliably
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
  v_processed_count integer := 0;
BEGIN
  -- Обрабатываем все активные записи в медпункте где время лечения истекло
  FOR medical_record IN 
    SELECT mb.*, ci.current_health, ci.max_health
    FROM public.medical_bay mb
    JOIN public.card_instances ci ON ci.id = mb.card_instance_id
    WHERE mb.is_completed = false
      AND mb.estimated_completion <= now()
    ORDER BY mb.placed_at ASC -- Process oldest first
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
    WHERE id = medical_record.id
      AND is_completed = false; -- Extra safety check
    
    v_processed_count := v_processed_count + 1;
    
    -- Log processing for debugging
    RAISE NOTICE 'Processed medical bay entry: card_instance_id=%, healed_amount=%, new_health=%', 
      medical_record.card_instance_id, v_healed_amount, v_new_health;
  END LOOP;
  
  -- Log total processed count
  RAISE NOTICE 'Total medical bay entries processed: %', v_processed_count;
END;
$$;