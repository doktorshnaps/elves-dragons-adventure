-- Добавляем логирование в get_card_instances_by_wallet чтобы понять кто создает рабочих
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet(p_wallet_address text)
RETURNS SETOF card_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- КРИТИЧЕСКИЙ ЛОГ: отслеживаем вызовы get_card_instances_by_wallet
  RAISE LOG 'GET_INSTANCES_DEBUG: get_card_instances_by_wallet called for wallet=%', p_wallet_address;
  
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  
  RETURN QUERY SELECT * FROM public.card_instances
  WHERE wallet_address = p_wallet_address
  ORDER BY created_at DESC;
END;
$$;