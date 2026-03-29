-- Fix: Replace current_setting('role') with auth.role() for pvp_ratings and user_item_exchanges

DROP POLICY IF EXISTS "Service role can update ratings" ON pvp_ratings;
CREATE POLICY "Service role can update ratings" ON pvp_ratings
  FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on user_item_exchanges" ON user_item_exchanges;
CREATE POLICY "Service role full access on user_item_exchanges" ON user_item_exchanges
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');