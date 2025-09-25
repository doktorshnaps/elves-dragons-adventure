-- Create or update RPC function to update resource production state
CREATE OR REPLACE FUNCTION public.update_resource_production_state_by_wallet(
  p_wallet_address text,
  p_resource text,
  p_last_collection_time bigint,
  p_is_producing boolean,
  p_is_storage_full boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate input parameters
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  
  IF p_resource NOT IN ('wood', 'stone') THEN
    RAISE EXCEPTION 'invalid resource type: %', p_resource;
  END IF;

  -- Update production state based on resource type
  IF p_resource = 'wood' THEN
    UPDATE public.game_data
    SET 
      wood_last_collection_time = p_last_collection_time,
      wood_production_data = jsonb_build_object(
        'isProducing', p_is_producing,
        'isStorageFull', p_is_storage_full
      ),
      updated_at = now()
    WHERE wallet_address = p_wallet_address;
  ELSE
    UPDATE public.game_data
    SET 
      stone_last_collection_time = p_last_collection_time,
      stone_production_data = jsonb_build_object(
        'isProducing', p_is_producing,
        'isStorageFull', p_is_storage_full
      ),
      updated_at = now()
    WHERE wallet_address = p_wallet_address;
  END IF;

  RETURN FOUND;
END;
$$;