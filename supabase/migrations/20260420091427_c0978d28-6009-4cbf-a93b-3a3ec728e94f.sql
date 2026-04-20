-- Enable required extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- RPC to auto-finalize expired treasure hunt events
CREATE OR REPLACE FUNCTION public.auto_finalize_expired_treasure_hunts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH updated AS (
    UPDATE public.treasure_hunt_events
    SET is_active = false
    WHERE is_active = true
      AND ended_at IS NOT NULL
      AND ended_at <= now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM updated;
  
  RETURN v_count;
END;
$$;

-- Allow anon/authenticated to call this RPC (idempotent and safe)
GRANT EXECUTE ON FUNCTION public.auto_finalize_expired_treasure_hunts() TO anon, authenticated;

-- Schedule cron every minute
DO $$
BEGIN
  -- Unschedule if already exists to avoid duplicates
  PERFORM cron.unschedule('auto-finalize-treasure-hunts')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-finalize-treasure-hunts');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'auto-finalize-treasure-hunts',
  '* * * * *',
  $$SELECT public.auto_finalize_expired_treasure_hunts();$$
);