-- Remove any unique constraints or unique indexes blocking multiple instances per template per wallet
DO $$
DECLARE c RECORD;
BEGIN
  -- Drop unique constraints
  FOR c IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.card_instances'::regclass 
      AND contype = 'u'
  ) LOOP
    EXECUTE format('ALTER TABLE public.card_instances DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
  
  -- Drop unique indexes if any remain
  FOR c IN (
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'card_instances' 
      AND indexdef ILIKE '%UNIQUE%'
  ) LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', c.indexname);
  END LOOP;
END $$;