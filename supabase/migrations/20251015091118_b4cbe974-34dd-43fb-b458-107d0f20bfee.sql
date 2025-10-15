-- Optimize get_card_instances_by_wallet function with better error handling and logging
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet(p_wallet_address text)
RETURNS SETOF public.card_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout = '30s'
AS $$
BEGIN
  -- КРИТИЧЕСКИЙ ЛОГ: отслеживаем вызовы get_card_instances_by_wallet
  RAISE LOG 'GET_INSTANCES_DEBUG: get_card_instances_by_wallet called for wallet=%', p_wallet_address;
  
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  
  -- Return cards ordered by creation date (newest first) with a reasonable limit
  RETURN QUERY 
  SELECT * FROM public.card_instances
  WHERE wallet_address = p_wallet_address
  ORDER BY created_at DESC
  LIMIT 1000;  -- Prevent returning too many records at once
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'GET_INSTANCES_ERROR: wallet=%, error=%', p_wallet_address, SQLERRM;
    RAISE;
END;
$$;

-- Add index to improve performance
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_created 
ON public.card_instances (wallet_address, created_at DESC);

-- Add index for medical bay queries
CREATE INDEX IF NOT EXISTS idx_card_instances_medical_bay 
ON public.card_instances (wallet_address, is_in_medical_bay) 
WHERE is_in_medical_bay = true;