-- Удаляем старую политику публичного доступа
DROP POLICY IF EXISTS "Anyone can view soul donations" ON public.soul_donations;

-- Создаём политику: пользователь видит только свои пожертвования
CREATE POLICY "Users can view own donations" 
ON public.soul_donations 
FOR SELECT 
USING (wallet_address = get_current_user_wallet());

-- Политика для админов: видят все пожертвования
CREATE POLICY "Admins can view all donations" 
ON public.soul_donations 
FOR SELECT 
USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- RPC функция для лидерборда с маскированными адресами
CREATE OR REPLACE FUNCTION public.get_soul_donations_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  wallet_address TEXT,
  total_donated BIGINT,
  donation_count BIGINT,
  last_donation TIMESTAMPTZ,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_wallet TEXT;
  v_is_admin BOOLEAN;
BEGIN
  v_current_wallet := get_current_user_wallet();
  v_is_admin := is_admin_or_super_wallet(v_current_wallet);
  
  RETURN QUERY
  SELECT 
    CASE 
      -- Свой адрес показываем полностью
      WHEN sd.wallet_address = v_current_wallet THEN sd.wallet_address
      -- Админам показываем полностью
      WHEN v_is_admin THEN sd.wallet_address
      -- Остальным маскируем: первые 2 символа + ****** + последние 5 символов
      ELSE LEFT(sd.wallet_address, 2) || '******' || RIGHT(sd.wallet_address, 5)
    END AS wallet_address,
    SUM(sd.amount)::BIGINT AS total_donated,
    COUNT(*)::BIGINT AS donation_count,
    MAX(sd.created_at) AS last_donation,
    ROW_NUMBER() OVER (ORDER BY SUM(sd.amount) DESC)::BIGINT AS rank
  FROM soul_donations sd
  GROUP BY sd.wallet_address
  ORDER BY total_donated DESC
  LIMIT p_limit;
END;
$$;