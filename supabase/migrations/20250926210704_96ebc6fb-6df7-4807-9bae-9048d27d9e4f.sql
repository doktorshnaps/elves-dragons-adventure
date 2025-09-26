-- Удаляем существующие функции
DROP FUNCTION IF EXISTS public.get_referrer_for_wallet(text);
DROP FUNCTION IF EXISTS public.get_referrals_by_referrer(text);
DROP FUNCTION IF EXISTS public.get_referral_earnings_by_referrer(text);

-- Создаем RPC функцию для получения информации о том, кто пригласил игрока
CREATE OR REPLACE FUNCTION public.get_referrer_for_wallet(p_wallet_address text)
RETURNS TABLE(referrer_wallet_address text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT r.referrer_wallet_address, r.created_at
  FROM public.referrals r
  WHERE r.referred_wallet_address = p_wallet_address
    AND r.is_active = true
  LIMIT 1;
END;
$$;

-- Создаем RPC функцию для получения рефералов пользователя
CREATE OR REPLACE FUNCTION public.get_referrals_by_referrer(p_wallet_address text)
RETURNS TABLE(id uuid, referred_wallet_address text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.referred_wallet_address, r.created_at
  FROM public.referrals r
  WHERE r.referrer_wallet_address = p_wallet_address
    AND r.is_active = true
  ORDER BY r.created_at DESC;
END;
$$;

-- Создаем RPC функцию для получения доходов от рефералов
CREATE OR REPLACE FUNCTION public.get_referral_earnings_by_referrer(p_wallet_address text)
RETURNS TABLE(id uuid, referred_wallet_address text, amount integer, level integer, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT re.id, re.referred_wallet_address, re.amount, re.level, re.created_at
  FROM public.referral_earnings re
  WHERE re.referrer_wallet_address = p_wallet_address
  ORDER BY re.created_at DESC;
END;
$$;