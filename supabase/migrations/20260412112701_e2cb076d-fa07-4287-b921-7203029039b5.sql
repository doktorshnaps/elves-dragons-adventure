
-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule building completion check every minute
SELECT cron.schedule(
  'check-building-completions',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://oimhwdymghkwxznjarkv.supabase.co/functions/v1/check-building-completions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k"}'::jsonb,
        body:='{}'::jsonb
    ) AS request_id;
  $$
);
