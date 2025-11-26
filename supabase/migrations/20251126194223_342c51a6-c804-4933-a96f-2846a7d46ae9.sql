-- Добавляем claim_key в active_dungeon_sessions для серверной генерации ключей
ALTER TABLE active_dungeon_sessions 
ADD COLUMN claim_key UUID DEFAULT gen_random_uuid() UNIQUE;

-- Индекс для быстрого поиска по claim_key
CREATE INDEX idx_active_dungeon_sessions_claim_key 
ON active_dungeon_sessions(claim_key);

-- Таблица для логирования подозрительной активности
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  wallet_address TEXT,
  claim_key TEXT,
  ip_address TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS для security_audit_log - только админы читают
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON security_audit_log FOR SELECT
USING (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Service role can insert audit log"
ON security_audit_log FOR INSERT
WITH CHECK (true);

-- Ужесточаем RLS политики для active_dungeon_sessions
-- Удаляем старые открытые политики
DROP POLICY IF EXISTS "Users can view their own dungeon sessions" ON active_dungeon_sessions;
DROP POLICY IF EXISTS "Users can insert their own dungeon sessions" ON active_dungeon_sessions;
DROP POLICY IF EXISTS "Users can update their own dungeon sessions" ON active_dungeon_sessions;
DROP POLICY IF EXISTS "Users can delete their own dungeon sessions" ON active_dungeon_sessions;

-- Новые строгие политики: только чтение своих сессий
CREATE POLICY "Users can view own sessions"
ON active_dungeon_sessions FOR SELECT
USING (account_id = get_current_user_wallet() OR account_id = (auth.jwt()->>'wallet_address'));

-- INSERT/UPDATE/DELETE только через SECURITY DEFINER функции (service_role)
CREATE POLICY "Service role full access"
ON active_dungeon_sessions FOR ALL
USING (current_setting('role', true) = 'service_role');