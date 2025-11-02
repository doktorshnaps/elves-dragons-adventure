-- Create storage bucket for monster images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'monster-images',
  'monster-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for monster images (permissions checked in edge function)
CREATE POLICY "Monster images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'monster-images');

CREATE POLICY "Allow uploads to monster-images bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'monster-images');

CREATE POLICY "Allow updates to monster-images bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'monster-images');

CREATE POLICY "Allow deletes from monster-images bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'monster-images');