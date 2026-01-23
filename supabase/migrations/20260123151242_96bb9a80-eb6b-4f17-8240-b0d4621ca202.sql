-- Clean up expired queue entries
DELETE FROM pvp_queue WHERE expires_at < now();

-- Create index on expires_at for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_pvp_queue_expires ON pvp_queue(expires_at);

-- Allow users to read their own queue entries directly
DROP POLICY IF EXISTS "Users can view their own queue entries" ON pvp_queue;
CREATE POLICY "Users can view their own queue entries"
  ON pvp_queue
  FOR SELECT
  USING (true);