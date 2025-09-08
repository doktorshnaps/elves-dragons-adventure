-- Deduplicate game_data by wallet_address and add unique partial index
BEGIN;

-- Remove duplicates keeping the latest updated_at per wallet_address
WITH ranked AS (
  SELECT id, wallet_address, updated_at,
         ROW_NUMBER() OVER (PARTITION BY wallet_address ORDER BY updated_at DESC, id DESC) AS rn
  FROM public.game_data
  WHERE wallet_address IS NOT NULL
)
DELETE FROM public.game_data gd
USING ranked r
WHERE gd.id = r.id AND r.rn > 1;

-- Create a unique index to prevent future duplicates (allow NULLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'ux_game_data_wallet_address'
  ) THEN
    CREATE UNIQUE INDEX ux_game_data_wallet_address
    ON public.game_data (wallet_address)
    WHERE wallet_address IS NOT NULL;
  END IF;
END $$;

COMMIT;