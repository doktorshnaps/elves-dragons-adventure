
-- 1. Treasure Hunt Leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_treasure_hunt_leaderboard(p_event_id UUID)
RETURNS TABLE(
  wallet_address TEXT,
  found_quantity INT,
  reward_claimed BOOLEAN,
  last_found_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN length(thf.wallet_address) > 10
      THEN substring(thf.wallet_address from 1 for 6) || '...' || substring(thf.wallet_address from length(thf.wallet_address) - 4)
      ELSE thf.wallet_address
    END AS wallet_address,
    thf.found_quantity::INT,
    thf.reward_claimed,
    thf.updated_at AS last_found_at
  FROM treasure_hunt_findings thf
  WHERE thf.event_id = p_event_id
  ORDER BY thf.found_quantity DESC;
$$;

-- 2. Atomic Soul Crystal Donation RPC
CREATE OR REPLACE FUNCTION public.donate_soul_crystals(p_wallet TEXT, p_amount INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_crystal_count INT;
  v_ids UUID[];
BEGIN
  IF p_wallet IS NULL OR p_wallet = '' THEN
    RAISE EXCEPTION 'wallet address is required';
  END IF;
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'amount must be at least 1';
  END IF;

  -- Count available crystals
  SELECT count(*)::INT INTO v_crystal_count
  FROM item_instances
  WHERE wallet_address = p_wallet
    AND (name = 'Кристалл Жизни' OR item_id = 'lifeCrystal');

  IF v_crystal_count < p_amount THEN
    RAISE EXCEPTION 'insufficient crystals: have %, need %', v_crystal_count, p_amount;
  END IF;

  -- Pick exact IDs to remove
  SELECT array_agg(id) INTO v_ids
  FROM (
    SELECT id FROM item_instances
    WHERE wallet_address = p_wallet
      AND (name = 'Кристалл Жизни' OR item_id = 'lifeCrystal')
    LIMIT p_amount
  ) sub;

  -- Remove crystals
  DELETE FROM item_instances WHERE id = ANY(v_ids);

  -- Record donation
  INSERT INTO soul_donations (wallet_address, amount)
  VALUES (p_wallet, p_amount);
END;
$$;

-- 3. Fix soul_donations SELECT policies: public -> authenticated
DROP POLICY IF EXISTS "Anyone can view donations" ON soul_donations;
DROP POLICY IF EXISTS "Users can view all donations" ON soul_donations;
DROP POLICY IF EXISTS "Anyone can insert donations" ON soul_donations;
DROP POLICY IF EXISTS "Users can insert donations" ON soul_donations;

CREATE POLICY "Authenticated users can view donations"
  ON soul_donations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert donations"
  ON soul_donations FOR INSERT
  TO authenticated
  WITH CHECK (wallet_address = get_current_user_wallet());
