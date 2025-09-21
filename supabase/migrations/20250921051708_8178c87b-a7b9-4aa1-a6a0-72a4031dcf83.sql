-- Drop only the specific unique constraint / index enforcing uniqueness of (wallet_address, card_template_id)
DO $$
DECLARE idx RECORD;
BEGIN
  -- Drop named constraint if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.card_instances'::regclass 
      AND conname = 'uq_card_instances_wallet_template'
  ) THEN
    ALTER TABLE public.card_instances 
      DROP CONSTRAINT uq_card_instances_wallet_template;
  END IF;

  -- Drop any unique index on (wallet_address, card_template_id)
  FOR idx IN (
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'card_instances' 
      AND indexdef ILIKE '%UNIQUE%'
      AND indexdef ILIKE '%(wallet_address, card_template_id)%'
  ) LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', idx.indexname);
  END LOOP;
END $$;