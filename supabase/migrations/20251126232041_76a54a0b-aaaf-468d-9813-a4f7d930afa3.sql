-- ============= АВТООЧИСТКА СТАРЫХ СЕССИЙ ПОДЗЕМЕЛИЙ =============

-- Удаляем старую версию функции
DROP FUNCTION IF EXISTS public.cleanup_old_dungeon_sessions();

-- Функция для очистки неактивных сессий
CREATE FUNCTION public.cleanup_old_dungeon_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_cutoff_time TIMESTAMPTZ;
BEGIN
  v_cutoff_time := NOW() - INTERVAL '24 hours';
  
  DELETE FROM active_dungeon_sessions
  WHERE 
    created_at < v_cutoff_time
    OR last_activity < EXTRACT(EPOCH FROM v_cutoff_time) * 1000;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleanup completed: % old sessions deleted', v_deleted_count;
  
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_dungeon_sessions() IS 
'Удаляет сессии подземелий старше 24 часов для предотвращения накопления устаревших данных';

-- ============= ФУНКЦИЯ ДЛЯ РУЧНОЙ ОЧИСТКИ С ПАРАМЕТРАМИ =============

DROP FUNCTION IF EXISTS public.cleanup_dungeon_sessions_by_age(INTEGER);

CREATE FUNCTION public.cleanup_dungeon_sessions_by_age(
  p_hours_threshold INTEGER DEFAULT 24
)
RETURNS TABLE(
  deleted_count INTEGER,
  cutoff_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_cutoff TIMESTAMPTZ;
BEGIN
  v_cutoff := NOW() - (p_hours_threshold || ' hours')::INTERVAL;
  
  DELETE FROM active_dungeon_sessions
  WHERE 
    created_at < v_cutoff
    OR last_activity < EXTRACT(EPOCH FROM v_cutoff) * 1000;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count, v_cutoff;
END;
$$;

COMMENT ON FUNCTION public.cleanup_dungeon_sessions_by_age(INTEGER) IS 
'Удаляет сессии подземелий старше указанного количества часов. По умолчанию 24 часа.';

-- ============= ТРИГГЕР ДЛЯ АВТОМАТИЧЕСКОЙ ОЧИСТКИ =============

DROP FUNCTION IF EXISTS public.trigger_cleanup_old_sessions() CASCADE;

CREATE FUNCTION public.trigger_cleanup_old_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_time TIMESTAMPTZ;
BEGIN
  v_cutoff_time := NOW() - INTERVAL '24 hours';
  
  DELETE FROM active_dungeon_sessions
  WHERE 
    id != NEW.id
    AND (
      created_at < v_cutoff_time
      OR last_activity < EXTRACT(EPOCH FROM v_cutoff_time) * 1000
    );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_cleanup_old_sessions
AFTER INSERT ON active_dungeon_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_cleanup_old_sessions();

COMMENT ON TRIGGER auto_cleanup_old_sessions ON active_dungeon_sessions IS 
'Автоматически очищает старые сессии (>24 часов) при создании новой сессии';

-- ============= ИНДЕКС ДЛЯ ОПТИМИЗАЦИИ ОЧИСТКИ =============

CREATE INDEX IF NOT EXISTS idx_active_dungeon_sessions_cleanup 
ON active_dungeon_sessions(created_at, last_activity);

COMMENT ON INDEX idx_active_dungeon_sessions_cleanup IS 
'Оптимизирует запросы на очистку старых сессий';