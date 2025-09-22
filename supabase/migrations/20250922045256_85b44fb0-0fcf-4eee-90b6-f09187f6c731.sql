-- Create a security definer function to fetch full game_data by wallet, including active_workers
CREATE OR REPLACE FUNCTION public.get_game_data_by_wallet_full(p_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec RECORD;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  SELECT * INTO rec
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF rec IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(rec);
END;
$function$;