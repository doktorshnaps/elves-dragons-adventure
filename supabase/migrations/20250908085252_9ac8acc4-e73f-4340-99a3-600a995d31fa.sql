-- Atomic open card packs: remove N packs by name and append new cards
CREATE OR REPLACE FUNCTION public.open_card_packs(
  p_wallet_address text,
  p_pack_name text,
  p_count integer,
  p_new_cards jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  g RECORD;
  available integer;
  updated_inventory jsonb;
  updated_cards jsonb;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  IF p_count IS NULL OR p_count < 1 THEN
    RAISE EXCEPTION 'invalid count';
  END IF;

  SELECT * INTO g FROM public.game_data WHERE wallet_address = p_wallet_address FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'game data not found';
  END IF;

  SELECT count(*) INTO available
  FROM jsonb_array_elements(coalesce(g.inventory,'[]'::jsonb)) AS e(elem)
  WHERE elem->>'type' = 'cardPack' AND elem->>'name' = p_pack_name;

  IF available < p_count THEN
    RAISE EXCEPTION 'not enough packs';
  END IF;

  WITH inv AS (
    SELECT elem, ordinality,
           (CASE WHEN elem->>'type'='cardPack' AND elem->>'name'=p_pack_name THEN 1 ELSE 0 END) AS is_pack,
           CASE WHEN elem->>'type'='cardPack' AND elem->>'name'=p_pack_name
                THEN row_number() OVER (PARTITION BY 1 ORDER BY ordinality) ELSE NULL END AS rn
    FROM jsonb_array_elements(coalesce(g.inventory,'[]'::jsonb)) WITH ORDINALITY AS e(elem, ordinality)
  )
  SELECT coalesce(jsonb_agg(elem ORDER BY ordinality), '[]'::jsonb)
  INTO updated_inventory
  FROM inv
  WHERE NOT (is_pack = 1 AND rn <= p_count);

  updated_cards := coalesce(g.cards, '[]'::jsonb) || coalesce(p_new_cards, '[]'::jsonb);

  UPDATE public.game_data
  SET inventory = updated_inventory,
      cards = updated_cards,
      updated_at = now()
  WHERE id = g.id;

  RETURN jsonb_build_object('inventory', updated_inventory, 'cards', updated_cards);
END;
$$;