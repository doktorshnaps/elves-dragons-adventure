-- Удаляем устаревшие версии функций медпункта без _v2

DROP FUNCTION IF EXISTS public.remove_card_from_medical_bay(uuid, text);
DROP FUNCTION IF EXISTS public.remove_card_from_medical_bay(uuid);
DROP FUNCTION IF EXISTS public.stop_healing_without_recovery(uuid);

-- Комментарий: Удалены устаревшие версии функций remove_card_from_medical_bay и stop_healing_without_recovery
-- Текущие рабочие версии: remove_card_from_medical_bay_v2 и stop_healing_without_recovery_v2