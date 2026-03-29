-- Block direct INSERT, UPDATE, DELETE on data_changes for non-service roles
-- Only service_role (triggers/edge functions) should write to this audit table

CREATE POLICY "Deny direct inserts on data_changes" ON data_changes
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Deny direct updates on data_changes" ON data_changes
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Deny direct deletes on data_changes" ON data_changes
  FOR DELETE USING (auth.role() = 'service_role');
