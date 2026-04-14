
CREATE OR REPLACE FUNCTION public.donate_soul_crystals(p_wallet TEXT, p_amount INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids UUID[];
  v_locked_count INT;
BEGIN
  IF p_wallet IS NULL OR p_wallet = '' THEN
    RAISE EXCEPTION 'wallet address is required';
  END IF;
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'amount must be at least 1';
  END IF;

  -- Pick and LOCK exact IDs to remove (FOR UPDATE SKIP LOCKED prevents double-processing)
  SELECT array_agg(id) INTO v_ids
  FROM (
    SELECT id FROM item_instances
    WHERE wallet_address = p_wallet
      AND (name = 'Кристалл Жизни' OR item_id = 'lifeCrystal')
    ORDER BY created_at
    LIMIT p_amount
    FOR UPDATE SKIP LOCKED
  ) sub;

  v_locked_count := coalesce(array_length(v_ids, 1), 0);

  IF v_locked_count < p_amount THEN
    RAISE EXCEPTION 'insufficient crystals: have %, need %', v_locked_count, p_amount;
  END IF;

  -- Remove crystals
  DELETE FROM item_instances WHERE id = ANY(v_ids);

  -- Record donation
  INSERT INTO soul_donations (wallet_address, amount)
  VALUES (p_wallet, p_amount);
END;
$$;
