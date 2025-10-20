-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload item images
CREATE POLICY "Admins can upload item images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-images' AND
  (get_current_user_wallet() = 'mr_bruts.tg' OR is_admin_wallet())
);

-- Allow everyone to view item images (public bucket)
CREATE POLICY "Anyone can view item images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'item-images');

-- Allow admins to delete item images
CREATE POLICY "Admins can delete item images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-images' AND
  (get_current_user_wallet() = 'mr_bruts.tg' OR is_admin_wallet())
);