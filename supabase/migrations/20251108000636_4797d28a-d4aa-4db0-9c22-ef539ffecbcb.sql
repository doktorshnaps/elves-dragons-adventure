-- Добавляем составной индекс для оптимизации запросов активных сессий подземелий
-- Используется в useLatestActiveDungeonSession для быстрого поиска последней сессии пользователя
CREATE INDEX IF NOT EXISTS idx_active_dungeon_sessions_account_activity 
ON public.active_dungeon_sessions(account_id, last_activity DESC);

-- Комментарий для документации
COMMENT ON INDEX idx_active_dungeon_sessions_account_activity IS 'Составной индекс для быстрого поиска последней активной сессии пользователя с фильтрацией по времени';