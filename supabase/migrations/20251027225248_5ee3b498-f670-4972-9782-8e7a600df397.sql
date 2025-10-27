-- RPC to insert item instances bypassing RLS (used by client)
CREATE OR REPLACE FUNCTION public.add_item_instances(
  p_wallet_address text,
  p_items jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(both from p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'p_items must be a JSON array';
  END IF;

  INSERT INTO public.item_instances (wallet_address, template_id, item_id, name, type)
  SELECT
    p_wallet_address,
    COALESCE(
      (SELECT id FROM public.item_templates WHERE name = elem->>'name' LIMIT 1),
      NULLIF(elem->>'template_id','')::integer
    ) AS template_id,
    COALESCE(
      (SELECT item_id FROM public.item_templates WHERE name = elem->>'name' LIMIT 1),
      NULLIF(elem->>'item_id','')
    ) AS item_id,
    elem->>'name' AS name,
    COALESCE(
      (SELECT type FROM public.item_templates WHERE name = elem->>'name' LIMIT 1),
      elem->>'type'
    ) AS type
  FROM jsonb_array_elements(p_items) AS elem;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;