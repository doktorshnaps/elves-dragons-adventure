
-- Сбросить флаг is_in_medical_bay для карточек, которые не находятся в medical_bay или forge_bay
-- Это исправляет ситуацию, когда карточки "застревают" с флагом после преждевременного выхода из медпункта/кузни

UPDATE card_instances ci
SET 
  is_in_medical_bay = false,
  updated_at = NOW()
WHERE ci.is_in_medical_bay = true
  AND NOT EXISTS (SELECT 1 FROM medical_bay mb WHERE mb.card_instance_id = ci.id)
  AND NOT EXISTS (SELECT 1 FROM forge_bay fb WHERE fb.card_instance_id = ci.id);

-- Вывести количество обновленных карточек
DO $$ 
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Сброшен флаг is_in_medical_bay для % карточек', updated_count;
END $$;
