-- =====================================================
-- Универсальная функция rate limiting для Edge Functions
-- =====================================================

-- Создаём функцию для проверки и регистрации запросов
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_identifier TEXT,          -- wallet_address или IP
  p_endpoint TEXT,            -- название endpoint
  p_window_seconds INT DEFAULT 60,
  p_max_requests INT DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_request_count INT;
BEGIN
  -- Определяем начало окна
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Удаляем старые записи (старше 1 часа) для очистки
  DELETE FROM api_rate_limits 
  WHERE created_at < NOW() - INTERVAL '1 hour';
  
  -- Считаем запросы в текущем окне
  SELECT COUNT(*) INTO v_request_count
  FROM api_rate_limits
  WHERE (ip_address = p_identifier OR ip_address = p_identifier)
    AND endpoint = p_endpoint
    AND created_at >= v_window_start;
  
  -- Проверяем лимит
  IF v_request_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Регистрируем новый запрос
  INSERT INTO api_rate_limits (ip_address, endpoint, created_at)
  VALUES (p_identifier, p_endpoint, NOW());
  
  RETURN TRUE;
END;
$$;

-- Создаём индексы для быстрого поиска (если не существуют)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_rate_limits_identifier_endpoint') THEN
    CREATE INDEX idx_api_rate_limits_identifier_endpoint 
    ON api_rate_limits(ip_address, endpoint, created_at DESC);
  END IF;
END $$;

-- Grants
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit TO service_role;