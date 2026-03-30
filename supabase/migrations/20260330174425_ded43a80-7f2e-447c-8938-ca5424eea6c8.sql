-- Fix 1: Restrict pvp_bot_teams SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active bot teams" ON pvp_bot_teams;
CREATE POLICY "Authenticated can view active bot teams" ON pvp_bot_teams
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Fix 2: Restrict clan_raid_attacks SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view raid attacks" ON clan_raid_attacks;
CREATE POLICY "Authenticated can view raid attacks" ON clan_raid_attacks
  FOR SELECT TO authenticated
  USING (true);