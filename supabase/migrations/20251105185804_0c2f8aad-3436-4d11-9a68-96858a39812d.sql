-- Ensure RPC permissions for crafting recipe admin functions
GRANT EXECUTE ON FUNCTION public.admin_update_crafting_recipe(
  uuid, text, text, integer, integer, jsonb, text, text, integer
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_delete_crafting_recipe(uuid, text) TO anon, authenticated;