-- Create table for card pack images
CREATE TABLE public.card_pack_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('character', 'pet')),
  rarity INTEGER NOT NULL CHECK (rarity >= 1 AND rarity <= 8),
  faction TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.card_pack_images ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view card pack images" 
ON public.card_pack_images 
FOR SELECT 
USING (true);

-- Create unique index on card_name to prevent duplicates
CREATE UNIQUE INDEX idx_card_pack_images_name ON public.card_pack_images(card_name);

-- Insert sample card images data
INSERT INTO public.card_pack_images (card_name, card_type, rarity, faction, image_url) VALUES
-- Rarity 1 (Common) - Heroes
('Молодой Воин Каледора', 'character', 1, 'Каледор', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/common-hero-1.jpg'),
('Лучник Сильванести', 'character', 1, 'Сильванести', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/common-hero-2.jpg'),
('Страж Фаэлина', 'character', 1, 'Фаэлин', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/common-hero-3.jpg'),

-- Rarity 2 (Uncommon) - Heroes  
('Капитан Элленара', 'character', 2, 'Элленар', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/uncommon-hero-1.jpg'),
('Маг Тэлэриона', 'character', 2, 'Тэлэрион', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/uncommon-hero-2.jpg'),

-- Rarity 3 (Rare) - Heroes
('Рыцарь Аэлантира', 'character', 3, 'Аэлантир', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/rare-hero-1.jpg'),
('Жрец Лиораса', 'character', 3, 'Лиорас', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/rare-hero-2.jpg'),

-- Rarity 4 (Epic) - Heroes
('Паладин Каледора', 'character', 4, 'Каледор', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/epic-hero-1.jpg'),
('Архимаг Сильванести', 'character', 4, 'Сильванести', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/epic-hero-2.jpg'),

-- Rarity 5 (Legendary) - Heroes
('Лорд Фаэлина', 'character', 5, 'Фаэлин', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/legendary-hero-1.jpg'),
('Принц Элленара', 'character', 5, 'Элленар', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/legendary-hero-2.jpg'),

-- Rarity 6 (Mythic) - Heroes
('Король Тэлэриона', 'character', 6, 'Тэлэрион', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/mythic-hero-1.jpg'),

-- Rarity 7 (Divine) - Heroes
('Бог Войны Аэлантира', 'character', 7, 'Аэлантир', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/divine-hero-1.jpg'),

-- Rarity 8 (Cosmic) - Heroes
('Создатель Лиораса', 'character', 8, 'Лиорас', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/cosmic-hero-1.jpg'),

-- Pets of different rarities
('Волчонок', 'pet', 1, 'Каледор', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/common-pet-1.jpg'),
('Лесной Дух', 'pet', 2, 'Сильванести', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/uncommon-pet-1.jpg'),
('Грифон', 'pet', 3, 'Фаэлин', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/rare-pet-1.jpg'),
('Феникс', 'pet', 4, 'Элленар', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/epic-pet-1.jpg'),
('Древний Дракон', 'pet', 5, 'Тэлэрион', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/legendary-pet-1.jpg'),
('Космический Дракон', 'pet', 6, 'Аэлантир', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/mythic-pet-1.jpg'),
('Божественный Единорог', 'pet', 7, 'Лиорас', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/divine-pet-1.jpg'),
('Вселенский Левиафан', 'pet', 8, 'Каледор', 'https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/game-assets/cards/cosmic-pet-1.jpg');

-- Create trigger for updated_at
CREATE TRIGGER update_card_pack_images_updated_at
BEFORE UPDATE ON public.card_pack_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();