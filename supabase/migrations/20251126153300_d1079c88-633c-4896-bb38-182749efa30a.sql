-- RPC функция для получения глобальной статистики карт
CREATE OR REPLACE FUNCTION public.get_global_card_stats(p_card_type text)
RETURNS TABLE (
  card_name text,
  card_faction text,
  total_found bigint,
  rarity integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (ci.card_data->>'name')::text as card_name,
    COALESCE((ci.card_data->>'faction')::text, 'Unknown') as card_faction,
    COUNT(*)::bigint as total_found,
    COALESCE((ci.card_data->>'rarity')::integer, 1) as rarity
  FROM card_instances ci
  WHERE ci.card_type = p_card_type
  GROUP BY (ci.card_data->>'name'), (ci.card_data->>'faction'), (ci.card_data->>'rarity')
  ORDER BY total_found DESC, card_name ASC;
END;
$$;

-- RPC функция для получения глобальной статистики предметов
CREATE OR REPLACE FUNCTION public.get_global_item_stats()
RETURNS TABLE (
  item_name text,
  item_type text,
  total_found bigint,
  template_id integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.name as item_name,
    it.type as item_type,
    COUNT(ii.id)::bigint as total_found,
    it.id as template_id
  FROM item_templates it
  LEFT JOIN item_instances ii ON ii.template_id = it.id
  WHERE COUNT(ii.id) > 0
  GROUP BY it.id, it.name, it.type
  ORDER BY total_found DESC, item_name ASC;
END;
$$;

-- Предоставляем доступ к функциям для всех
GRANT EXECUTE ON FUNCTION public.get_global_card_stats(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_item_stats() TO anon, authenticated;