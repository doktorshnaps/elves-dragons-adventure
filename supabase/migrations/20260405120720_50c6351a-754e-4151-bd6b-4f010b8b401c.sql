-- Fix: Restrict clan asset uploads to user's own clan folder
DROP POLICY IF EXISTS "Clan members upload assets" ON storage.objects;

CREATE POLICY "Clan members upload assets" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'clan-assets'
  AND EXISTS (
    SELECT 1
    FROM clan_members
    WHERE clan_members.wallet_address = get_current_user_wallet()
      AND clan_members.clan_id::text = (storage.foldername(name))[1]
  )
);