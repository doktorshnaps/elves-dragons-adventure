-- Tighten clan-assets storage policies: require clan membership for upload, owner check for update/delete

DROP POLICY IF EXISTS "Authenticated upload clan assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update clan assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete clan assets" ON storage.objects;

-- INSERT: only clan members can upload
CREATE POLICY "Clan members upload assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'clan-assets'
    AND EXISTS (
      SELECT 1 FROM clan_members
      WHERE wallet_address = get_current_user_wallet()
    )
  );

-- UPDATE: only the uploader (owner) can update
CREATE POLICY "Owner update clan assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'clan-assets'
    AND owner = auth.uid()
  );

-- DELETE: only the uploader (owner) can delete
CREATE POLICY "Owner delete clan assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'clan-assets'
    AND owner = auth.uid()
  );