-- Restrict clan_raid_attacks SELECT to clan members only
-- This prevents exposing team_snapshot (full card composition) to non-clan members

DROP POLICY IF EXISTS "Authenticated can view raid attacks" ON clan_raid_attacks;

-- Users can only view raid attacks from their own clan
CREATE POLICY "Clan members can view own clan raid attacks"
  ON clan_raid_attacks
  FOR SELECT
  TO authenticated
  USING (
    clan_id IN (
      SELECT cm.clan_id FROM clan_members cm
      WHERE cm.wallet_address = get_current_user_wallet()
    )
  );

-- Admins can view all raid attacks
CREATE POLICY "Admins can view all raid attacks"
  ON clan_raid_attacks
  FOR SELECT
  TO authenticated
  USING (is_admin_or_super_wallet(get_current_user_wallet()));