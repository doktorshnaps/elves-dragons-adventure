-- RPC функция для удаления всех предметов события при его удалении
CREATE OR REPLACE FUNCTION delete_treasure_hunt_items(
  p_template_id INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Удаляем все предметы с указанным template_id
  DELETE FROM item_instances
  WHERE template_id = p_template_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % quest items with template_id %', v_deleted_count, p_template_id;
  
  RETURN v_deleted_count;
END;
$$;