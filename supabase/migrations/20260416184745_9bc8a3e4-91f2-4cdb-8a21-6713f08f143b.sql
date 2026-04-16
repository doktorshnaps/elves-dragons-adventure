-- 1. Очистить уже застрявшие карты: is_in_medical_bay=true, но нет активной записи в medical_bay
UPDATE public.card_instances ci
SET is_in_medical_bay = false,
    medical_bay_start_time = NULL,
    medical_bay_heal_rate = NULL,
    updated_at = NOW()
WHERE ci.is_in_medical_bay = true
  AND NOT EXISTS (
    SELECT 1 FROM public.medical_bay mb
    WHERE mb.card_instance_id = ci.id AND mb.is_completed = false
  );

-- 2. Триггер: при удалении или завершении (is_completed=true) записи medical_bay
--    автоматически сбрасывать флаг is_in_medical_bay у соответствующей карты,
--    если для неё больше нет активных записей.
CREATE OR REPLACE FUNCTION public.sync_card_medical_bay_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_card_id UUID;
  v_has_active BOOLEAN;
BEGIN
  -- Determine which card_instance_id to check
  IF (TG_OP = 'DELETE') THEN
    v_target_card_id := OLD.card_instance_id;
  ELSE
    v_target_card_id := NEW.card_instance_id;
  END IF;

  IF v_target_card_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Are there any still-active medical_bay rows for this card?
  SELECT EXISTS(
    SELECT 1 FROM public.medical_bay
    WHERE card_instance_id = v_target_card_id
      AND is_completed = false
  ) INTO v_has_active;

  IF NOT v_has_active THEN
    UPDATE public.card_instances
    SET is_in_medical_bay = false,
        medical_bay_start_time = NULL,
        medical_bay_heal_rate = NULL,
        updated_at = NOW()
    WHERE id = v_target_card_id
      AND is_in_medical_bay = true;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_card_medical_bay_flag_del ON public.medical_bay;
DROP TRIGGER IF EXISTS trg_sync_card_medical_bay_flag_upd ON public.medical_bay;

CREATE TRIGGER trg_sync_card_medical_bay_flag_del
AFTER DELETE ON public.medical_bay
FOR EACH ROW
EXECUTE FUNCTION public.sync_card_medical_bay_flag();

CREATE TRIGGER trg_sync_card_medical_bay_flag_upd
AFTER UPDATE OF is_completed ON public.medical_bay
FOR EACH ROW
WHEN (NEW.is_completed = true AND OLD.is_completed = false)
EXECUTE FUNCTION public.sync_card_medical_bay_flag();