-- Создаем функцию для получения item_instances по wallet_address (обходит RLS)
CREATE OR REPLACE FUNCTION public.get_item_instances_by_wallet(p_wallet_address text)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  wallet_address text,
  template_id integer,
  item_id text,
  name text,
  type text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  RETURN QUERY
  SELECT 
    ii.id,
    ii.user_id,
    ii.wallet_address,
    ii.template_id,
    ii.item_id,
    ii.name,
    ii.type,
    ii.created_at,
    ii.updated_at
  FROM public.item_instances ii
  WHERE ii.wallet_address = p_wallet_address;
END;
$$;