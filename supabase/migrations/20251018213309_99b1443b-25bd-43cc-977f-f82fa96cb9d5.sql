-- Удаляем дублирующийся индекс на active_dungeon_sessions
-- Оставляем idx_active_dungeon_sessions_account_id как более конкретный по названию
-- Удаляем idx_active_dungeon_sessions_account как дубликат

DROP INDEX IF EXISTS public.idx_active_dungeon_sessions_account;