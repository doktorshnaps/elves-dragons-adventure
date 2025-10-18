-- Fix 400 on upsert: add UNIQUE(account_id, device_id) so on_conflict works
-- Also enable realtime properly and ensure updated_at trigger exists

-- 1) Ensure unique constraint for upsert target
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'active_dungeon_sessions_account_device_key'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.active_dungeon_sessions
      ADD CONSTRAINT active_dungeon_sessions_account_device_key
      UNIQUE (account_id, device_id);
  END IF;
END$$;

-- 2) Helpful index for lookups by account
CREATE INDEX IF NOT EXISTS idx_active_dungeon_sessions_account
  ON public.active_dungeon_sessions (account_id);

-- 3) Ensure full row data for realtime
ALTER TABLE public.active_dungeon_sessions REPLICA IDENTITY FULL;

-- 4) Add table to supabase_realtime publication (ignore if already added)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.active_dungeon_sessions;
    EXCEPTION WHEN duplicate_object THEN
      -- already added
      NULL;
    END;
  END IF;
END$$;

-- 5) Ensure updated_at is maintained on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_active_dungeon_sessions_updated_at'
  ) THEN
    CREATE TRIGGER trg_active_dungeon_sessions_updated_at
    BEFORE UPDATE ON public.active_dungeon_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;
