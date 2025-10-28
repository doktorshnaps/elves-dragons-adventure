-- Create RPC function to remove item instances bypassing RLS
CREATE OR REPLACE FUNCTION public.remove_item_instances(
  p_wallet_address text,
  p_instance_ids text[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  -- Validate inputs
  IF p_wallet_address IS NULL OR length(trim(both from p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  
  IF p_instance_ids IS NULL OR array_length(p_instance_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'p_instance_ids must be a non-empty array';
  END IF;

  -- Delete items matching both wallet and IDs (security check)
  DELETE FROM public.item_instances
  WHERE wallet_address = p_wallet_address
    AND id = ANY(p_instance_ids::uuid[]);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted;
END;
$$;