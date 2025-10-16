-- Создаем таблицу для хранения изображений карт
CREATE TABLE IF NOT EXISTS public.card_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('hero', 'dragon')),
  rarity INTEGER NOT NULL CHECK (rarity >= 1 AND rarity <= 8),
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by_wallet_address TEXT NOT NULL,
  UNIQUE(card_name, card_type, rarity)
);

-- Индекс для быстрого поиска
CREATE INDEX idx_card_images_lookup ON public.card_images(card_name, card_type, rarity);

-- RLS политики
ALTER TABLE public.card_images ENABLE ROW LEVEL SECURITY;

-- Все могут читать
CREATE POLICY "Anyone can view card images"
  ON public.card_images
  FOR SELECT
  USING (true);

-- Только админы могут вставлять
CREATE POLICY "Only admins can insert card images"
  ON public.card_images
  FOR INSERT
  WITH CHECK (is_admin_wallet());

-- Только админы могут обновлять
CREATE POLICY "Only admins can update card images"
  ON public.card_images
  FOR UPDATE
  USING (is_admin_wallet());

-- Только админы могут удалять
CREATE POLICY "Only admins can delete card images"
  ON public.card_images
  FOR DELETE
  USING (is_admin_wallet());

-- Создаем бакет для изображений карт если его еще нет
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage политики для бакета card-images
CREATE POLICY "Public can view card images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'card-images');

CREATE POLICY "Admins can upload card images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'card-images' AND
    (auth.jwt() ->> 'role' = 'service_role' OR
     EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE wallet_address = (
         SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
       ) AND role IN ('admin', 'super_admin')
     ))
  );

CREATE POLICY "Admins can update card images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'card-images' AND
    (auth.jwt() ->> 'role' = 'service_role' OR
     EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE wallet_address = (
         SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
       ) AND role IN ('admin', 'super_admin')
     ))
  );

CREATE POLICY "Admins can delete card images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'card-images' AND
    (auth.jwt() ->> 'role' = 'service_role' OR
     EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE wallet_address = (
         SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
       ) AND role IN ('admin', 'super_admin')
     ))
  );