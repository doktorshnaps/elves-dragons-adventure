-- Create admin function to delete item templates
CREATE OR REPLACE FUNCTION public.admin_delete_item_template(
  p_wallet_address text,
  p_item_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin or super admin
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  -- First, delete related dungeon_item_drops
  DELETE FROM public.dungeon_item_drops WHERE item_template_id = p_item_id;
  
  -- Set template_id to null for related item_instances (so they keep existing but unlinked)
  UPDATE public.item_instances SET template_id = NULL WHERE template_id = p_item_id;
  
  -- Delete from crafting_recipes if it's a result item
  DELETE FROM public.crafting_recipes WHERE result_item_id = p_item_id;

  -- Delete the item template
  DELETE FROM public.item_templates WHERE id = p_item_id;
  
  RETURN true;
END;
$function$;