-- Сбрасываем застрявший флаг is_in_medical_bay для карт, которых нет в медпункте или кузнице
-- Проблема: карты были удалены из medical_bay/forge_bay, но флаг остался true

-- Функция для очистки застрявших флагов медпункта/кузницы
CREATE OR REPLACE FUNCTION public.cleanup_stuck_medical_bay_flags()
RETURNS TABLE(cleaned_count bigint, card_names text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleaned_count bigint;
  v_card_names text[];
BEGIN
  -- Сохраняем имена карт, которые будут очищены
  SELECT 
    COUNT(*),
    ARRAY_AGG(card_data->>'name')
  INTO v_cleaned_count, v_card_names
  FROM card_instances ci
  WHERE ci.is_in_medical_bay = true
    AND NOT EXISTS (
      SELECT 1 FROM medical_bay mb 
      WHERE mb.card_instance_id = ci.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM forge_bay fb 
      WHERE fb.card_instance_id = ci.id
    );

  -- Сбрасываем флаг
  UPDATE card_instances ci
  SET 
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE ci.is_in_medical_bay = true
    AND NOT EXISTS (
      SELECT 1 FROM medical_bay mb 
      WHERE mb.card_instance_id = ci.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM forge_bay fb 
      WHERE fb.card_instance_id = ci.id
    );

  RETURN QUERY SELECT v_cleaned_count, v_card_names;
END;
$$;

-- Выполняем очистку и логируем результат
DO $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM public.cleanup_stuck_medical_bay_flags();
  
  IF v_result.cleaned_count > 0 THEN
    RAISE NOTICE 'Cleaned % stuck medical bay flags for cards: %', 
      v_result.cleaned_count, v_result.card_names;
  ELSE
    RAISE NOTICE 'No stuck medical bay flags found';
  END IF;
END $$;