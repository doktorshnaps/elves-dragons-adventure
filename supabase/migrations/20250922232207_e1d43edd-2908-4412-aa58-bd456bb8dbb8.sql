-- New exact RPC to delete card instance by id without overloading conflicts
CREATE OR REPLACE FUNCTION public.remove_card_instance_exact(p_wallet_address text, p_instance_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_deleted integer;
BEGIN
  IF p_instance_id IS NULL OR p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  DELETE FROM public.card_instances
  WHERE id = p_instance_id AND wallet_address = p_wallet_address;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$function$;