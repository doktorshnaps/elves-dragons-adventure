
-- 1. Add request_id column to soul_donations
ALTER TABLE soul_donations ADD COLUMN IF NOT EXISTS request_id uuid;

-- Create unique index on request_id (nulls allowed for old rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_soul_donations_request_id ON soul_donations (request_id) WHERE request_id IS NOT NULL;

-- 2. Recreate donate_soul_crystals with idempotency
CREATE OR REPLACE FUNCTION public.donate_soul_crystals(p_wallet TEXT, p_amount INT, p_request_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids UUID[];
  v_count INT;
BEGIN
  IF p_wallet IS NULL OR p_wallet = '' THEN
    RAISE EXCEPTION 'wallet address is required';
  END IF;
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'amount must be at least 1';
  END IF;

  -- Serialize all donations for this wallet
  PERFORM pg_advisory_xact_lock(hashtext(p_wallet));

  -- Idempotency: if this request_id was already processed, silently return
  IF p_request_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM soul_donations WHERE request_id = p_request_id) THEN
      RETURN;
    END IF;
  END IF;

  -- Select crystals to remove (no SKIP LOCKED needed since we hold advisory lock)
  SELECT array_agg(id) INTO v_ids
  FROM (
    SELECT id FROM item_instances
    WHERE wallet_address = p_wallet
      AND (name = 'Кристалл Жизни' OR item_id = 'lifeCrystal')
    ORDER BY created_at
    LIMIT p_amount
    FOR UPDATE
  ) sub;

  v_count := coalesce(array_length(v_ids, 1), 0);

  IF v_count < p_amount THEN
    RAISE EXCEPTION 'insufficient crystals: have %, need %', v_count, p_amount;
  END IF;

  DELETE FROM item_instances WHERE id = ANY(v_ids);

  INSERT INTO soul_donations (wallet_address, amount, request_id)
  VALUES (p_wallet, p_amount, p_request_id);
END;
$$;

-- 3. Data fix: remove duplicate donations and restore crystals
-- Find and delete duplicates (keep earliest row per duplicate pair)
WITH duplicates AS (
  SELECT id, wallet_address, amount,
    ROW_NUMBER() OVER (
      PARTITION BY wallet_address, amount,
        date_trunc('second', created_at),
        (EXTRACT(MILLISECONDS FROM created_at)::int / 100)
      ORDER BY created_at
    ) as rn
  FROM soul_donations
),
deleted AS (
  DELETE FROM soul_donations
  WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
  RETURNING wallet_address, amount
)
-- Restore crystals for each deleted duplicate
INSERT INTO item_instances (wallet_address, name, item_id, type)
SELECT wallet_address, 'Кристалл Жизни', 'lifeCrystal', 'resource'
FROM deleted, generate_series(1, amount) AS s;
