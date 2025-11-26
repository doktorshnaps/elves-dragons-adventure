-- Исправляем функцию получения глобальной статистики предметов
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
  GROUP BY it.id, it.name, it.type
  HAVING COUNT(ii.id) > 0
  ORDER BY total_found DESC, item_name ASC;
END;
$$;