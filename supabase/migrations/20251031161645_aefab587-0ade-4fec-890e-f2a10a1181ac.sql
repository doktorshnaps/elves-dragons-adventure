-- Admin delete RPC to bypass RLS while enforcing wallet-based admin check
CREATE OR REPLACE FUNCTION public.admin_delete_crafting_recipe(p_id uuid, p_wallet text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_wallet) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.crafting_recipes WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_crafting_recipe(uuid, text) TO anon, authenticated;