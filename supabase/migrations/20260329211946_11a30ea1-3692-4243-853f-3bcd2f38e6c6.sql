-- Fix 1: Replace current_setting('role') = 'service_role' with auth.role() = 'service_role'
-- This prevents authenticated users from spoofing service_role via SET LOCAL

-- === active_dungeon_sessions ===
DROP POLICY IF EXISTS "Service role full access" ON active_dungeon_sessions;
CREATE POLICY "Service role full access" ON active_dungeon_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- === pvp_bot_teams ===
DROP POLICY IF EXISTS "Service role can delete bot teams" ON pvp_bot_teams;
CREATE POLICY "Service role can delete bot teams" ON pvp_bot_teams
  FOR DELETE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert bot teams" ON pvp_bot_teams;
CREATE POLICY "Service role can insert bot teams" ON pvp_bot_teams
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update bot teams" ON pvp_bot_teams;
CREATE POLICY "Service role can update bot teams" ON pvp_bot_teams
  FOR UPDATE USING (auth.role() = 'service_role');

-- === pvp_matches ===
DROP POLICY IF EXISTS "Service role can manage matches" ON pvp_matches;
CREATE POLICY "Service role can manage matches" ON pvp_matches
  FOR ALL USING (auth.role() = 'service_role');

-- === pvp_moves ===
DROP POLICY IF EXISTS "Service role can manage moves" ON pvp_moves;
CREATE POLICY "Service role can manage moves" ON pvp_moves
  FOR ALL USING (auth.role() = 'service_role');

-- === shop_sessions ===
DROP POLICY IF EXISTS "Service role full access on shop_sessions" ON shop_sessions;
CREATE POLICY "Service role full access on shop_sessions" ON shop_sessions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- === pvp_queue ===
DROP POLICY IF EXISTS "Service role can manage queue" ON pvp_queue;
CREATE POLICY "Service role can manage queue" ON pvp_queue
  FOR ALL USING (auth.role() = 'service_role');