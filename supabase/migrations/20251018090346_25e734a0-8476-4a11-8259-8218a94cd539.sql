-- Enforce single active dungeon session per wallet within timeout using a trigger
-- Uses 30s window to align with cleanup function

CREATE OR REPLACE FUNCTION public.ensure_single_active_dungeon_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_timeout_ms integer := 30000; -- 30 seconds window
  v_now_ms bigint := (EXTRACT(EPOCH FROM now()) * 1000)::bigint;
  v_exists boolean;
BEGIN
  -- Ensure last_activity is set for NEW row
  IF NEW.last_activity IS NULL THEN
    NEW.last_activity := v_now_ms;
  END IF;

  -- Block if there is another recent session for the same account on a different device
  SELECT EXISTS (
    SELECT 1
    FROM public.active_dungeon_sessions s
    WHERE s.account_id = NEW.account_id
      AND s.device_id <> NEW.device_id
      AND s.last_activity > v_now_ms - v_timeout_ms
  ) INTO v_exists;

  IF v_exists THEN
    RAISE EXCEPTION 'Active dungeon session already exists for this wallet within % ms', v_timeout_ms;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger (idempotent)
DROP TRIGGER IF EXISTS trg_single_active_dungeon_session ON public.active_dungeon_sessions;
CREATE TRIGGER trg_single_active_dungeon_session
BEFORE INSERT OR UPDATE ON public.active_dungeon_sessions
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_active_dungeon_session();

-- Helpful index for trigger lookup
CREATE INDEX IF NOT EXISTS idx_active_dungeon_sessions_account_last
ON public.active_dungeon_sessions (account_id, last_activity DESC);
