-- ==========================================
-- ENHANCED SECURITY FOR DUNGEON REWARDS
-- ==========================================

-- 1. Таблица для отслеживания nonce (одноразовых токенов)
CREATE TABLE IF NOT EXISTS public.claim_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Индекс для быстрого поиска по nonce и очистки старых записей
CREATE INDEX idx_claim_nonces_nonce ON public.claim_nonces(nonce);
CREATE INDEX idx_claim_nonces_wallet ON public.claim_nonces(wallet_address);
CREATE INDEX idx_claim_nonces_expires ON public.claim_nonces(expires_at);

-- RLS политики для claim_nonces (только service role)
ALTER TABLE public.claim_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on claim_nonces"
  ON public.claim_nonces
  FOR ALL
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

-- 2. Таблица для rate limiting claims (защита от спама)
CREATE TABLE IF NOT EXISTS public.claim_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  claim_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_claim_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индекс для быстрого поиска и очистки
CREATE INDEX idx_claim_rate_limits_wallet ON public.claim_rate_limits(wallet_address);
CREATE INDEX idx_claim_rate_limits_window ON public.claim_rate_limits(window_start);

-- RLS политики для claim_rate_limits (только service role)
ALTER TABLE public.claim_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on claim_rate_limits"
  ON public.claim_rate_limits
  FOR ALL
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

-- 3. Расширение security_audit_log для типов claim-ошибок
-- (таблица уже существует, добавим только комментарии для документации)
COMMENT ON TABLE public.security_audit_log IS 'Security audit log including claim fraud attempts. Event types: INVALID_SESSION, INVALID_NONCE, SESSION_EXPIRED, ALREADY_CLAIMED, INVALID_KILL_SEQUENCE, RATE_LIMITED, SUSPICIOUS_REWARD_VALUES';

-- 4. Функция для автоматической очистки старых nonces (триггер)
CREATE OR REPLACE FUNCTION public.cleanup_expired_nonces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.claim_nonces
  WHERE expires_at < now() - interval '1 hour';
END;
$$;

-- 5. Функция для очистки старых rate limit записей
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.claim_rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- 6. RPC функция для генерации nonce (вызывается перед claim)
CREATE OR REPLACE FUNCTION public.generate_claim_nonce(
  p_wallet_address TEXT,
  p_session_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nonce TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Генерируем криптографически безопасный nonce
  v_nonce := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '5 minutes';
  
  -- Сохраняем nonce
  INSERT INTO public.claim_nonces (nonce, wallet_address, session_id, expires_at)
  VALUES (v_nonce, p_wallet_address, p_session_id, v_expires_at);
  
  -- Возвращаем nonce и время истечения
  RETURN json_build_object(
    'nonce', v_nonce,
    'expires_at', v_expires_at,
    'session_id', p_session_id
  );
END;
$$;

-- 7. RPC функция для проверки rate limit
CREATE OR REPLACE FUNCTION public.check_claim_rate_limit(
  p_wallet_address TEXT,
  p_max_claims_per_minute INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit RECORD;
  v_window_duration INTERVAL := interval '1 minute';
BEGIN
  -- Получаем текущую запись rate limit
  SELECT * INTO v_rate_limit
  FROM public.claim_rate_limits
  WHERE wallet_address = p_wallet_address
    AND window_start > now() - v_window_duration
  FOR UPDATE;
  
  -- Если записи нет или окно истекло, создаем новую
  IF v_rate_limit IS NULL OR v_rate_limit.window_start < now() - v_window_duration THEN
    INSERT INTO public.claim_rate_limits (wallet_address, claim_count, window_start, last_claim_at)
    VALUES (p_wallet_address, 1, now(), now())
    ON CONFLICT (wallet_address) 
    DO UPDATE SET 
      claim_count = 1,
      window_start = now(),
      last_claim_at = now();
    
    RETURN TRUE;
  END IF;
  
  -- Проверяем, не превышен ли лимит
  IF v_rate_limit.claim_count >= p_max_claims_per_minute THEN
    RETURN FALSE;
  END IF;
  
  -- Увеличиваем счетчик
  UPDATE public.claim_rate_limits
  SET 
    claim_count = claim_count + 1,
    last_claim_at = now()
  WHERE wallet_address = p_wallet_address;
  
  RETURN TRUE;
END;
$$;

-- 8. Добавляем уникальный constraint для claim_rate_limits
ALTER TABLE public.claim_rate_limits
ADD CONSTRAINT claim_rate_limits_wallet_unique UNIQUE (wallet_address);