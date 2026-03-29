-- Fix 2: Restrict storage bucket write policies
-- monster-images, quest-images, game-assets: admin-only (uploads via edge functions use service_role)
-- clan-assets: authenticated users only (client uploads, leadership checked by RPC)

-- === MONSTER-IMAGES ===
DROP POLICY IF EXISTS "Allow uploads to monster-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to monster-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from monster-images bucket" ON storage.objects;

CREATE POLICY "Admin upload monster images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'monster-images' AND is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admin update monster images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'monster-images' AND is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admin delete monster images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'monster-images' AND is_admin_or_super_wallet(get_current_user_wallet()));

-- === QUEST-IMAGES ===
DROP POLICY IF EXISTS "Anyone can upload quest images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update quest images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete quest images" ON storage.objects;

CREATE POLICY "Admin upload quest images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quest-images' AND is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admin update quest images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'quest-images' AND is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admin delete quest images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'quest-images' AND is_admin_or_super_wallet(get_current_user_wallet()));

-- === GAME-ASSETS ===
DROP POLICY IF EXISTS "Users can upload game assets" ON storage.objects;

CREATE POLICY "Admin upload game assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'game-assets' AND is_admin_or_super_wallet(get_current_user_wallet()));

-- === CLAN-ASSETS ===
DROP POLICY IF EXISTS "Clan leaders can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Clan leaders can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Clan leaders can delete assets" ON storage.objects;

CREATE POLICY "Authenticated upload clan assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clan-assets');

CREATE POLICY "Authenticated update clan assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'clan-assets');

CREATE POLICY "Authenticated delete clan assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'clan-assets');