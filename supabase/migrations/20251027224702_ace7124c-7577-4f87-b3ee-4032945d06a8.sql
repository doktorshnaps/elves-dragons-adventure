-- Backfill item_instances from game_data.inventory for a wallet (fixed)
CREATE OR REPLACE FUNCTION public.backfill_item_instances_from_inventory(p_wallet_address text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inventory jsonb;
  v_inserted integer := 0;
BEGIN
  -- Load inventory JSON
  SELECT inventory INTO v_inventory
  FROM public.game_data
  WHERE wallet_address = p_wallet_address;

  IF v_inventory IS NULL THEN
    v_inventory := '[]'::jsonb;
  END IF;

  -- Insert one instance per inventory item
  INSERT INTO public.item_instances (wallet_address, template_id, item_id, name, type)
  SELECT
    p_wallet_address,
    t.id::integer AS template_id,
    t.item_id::text AS item_id,
    (item_data->>'name')::text AS name,
    COALESCE(t.type::text, item_data->>'type') AS type
  FROM jsonb_array_elements(v_inventory) AS item_data
  LEFT JOIN public.item_templates t ON t.name = item_data->>'name';

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RAISE LOG 'Backfilled % item_instances for % from inventory', v_inserted, p_wallet_address;
  RETURN v_inserted;
END;
$$;

-- Run backfill for mr_bruts.tg
SELECT public.backfill_item_instances_from_inventory('mr_bruts.tg');