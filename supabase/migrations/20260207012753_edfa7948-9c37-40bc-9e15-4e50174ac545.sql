-- Fix 1: Drop the old 3-arg overload that causes duplicate inserts
DROP FUNCTION IF EXISTS public.admin_give_player_card(text, text, jsonb);

-- Fix 2: Increase LIMIT in get_card_instances_by_wallet to handle large collections
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet(p_wallet_address text)
RETURNS SETOF card_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  
  RETURN QUERY 
  SELECT * FROM public.card_instances
  WHERE wallet_address = p_wallet_address
  ORDER BY created_at DESC
  LIMIT 5000;
END;
$$;