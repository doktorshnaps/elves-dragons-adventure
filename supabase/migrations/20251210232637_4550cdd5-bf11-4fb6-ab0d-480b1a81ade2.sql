-- Create faction_elements table for elemental system
CREATE TABLE public.faction_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faction_name TEXT NOT NULL UNIQUE,
  element_type TEXT NOT NULL,
  element_emoji TEXT NOT NULL,
  strong_against TEXT NOT NULL,
  weak_against TEXT NOT NULL,
  damage_bonus NUMERIC NOT NULL DEFAULT 0.20,
  damage_penalty NUMERIC NOT NULL DEFAULT 0.20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faction_elements ENABLE ROW LEVEL SECURITY;

-- Anyone can view faction elements
CREATE POLICY "Anyone can view faction elements"
ON public.faction_elements
FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Only admins can modify faction elements"
ON public.faction_elements
FOR ALL
USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- Insert faction element data with CORRECT mappings
INSERT INTO public.faction_elements (faction_name, element_type, element_emoji, strong_against, weak_against) VALUES
('Каледор', 'ice', '❄️', 'water', 'earth'),
('Сильванести', 'fire', '🔥', 'nature', 'water'),
('Фаэлин', 'water', '💧', 'fire', 'ice'),
('Элленар', 'light', '✨', 'darkness', 'darkness'),
('Тэлэрион', 'darkness', '🌑', 'light', 'light'),
('Аэлантир', 'earth', '🪨', 'ice', 'nature'),
('Лиорас', 'nature', '🌿', 'earth', 'fire');

-- Add element column to dungeon_settings for monster elements
ALTER TABLE public.dungeon_settings 
ADD COLUMN IF NOT EXISTS dungeon_element TEXT DEFAULT 'neutral';

-- Update dungeons with thematic elements
UPDATE public.dungeon_settings SET dungeon_element = 'nature' WHERE dungeon_type = 'spider_nest';
UPDATE public.dungeon_settings SET dungeon_element = 'darkness' WHERE dungeon_type = 'bone_dungeon';
UPDATE public.dungeon_settings SET dungeon_element = 'darkness' WHERE dungeon_type = 'dark_mage';
UPDATE public.dungeon_settings SET dungeon_element = 'darkness' WHERE dungeon_type = 'forgotten_souls';
UPDATE public.dungeon_settings SET dungeon_element = 'ice' WHERE dungeon_type = 'ice_throne';
UPDATE public.dungeon_settings SET dungeon_element = 'water' WHERE dungeon_type = 'sea_serpent';
UPDATE public.dungeon_settings SET dungeon_element = 'fire' WHERE dungeon_type = 'black_dragon';
UPDATE public.dungeon_settings SET dungeon_element = 'light' WHERE dungeon_type = 'pantheon_gods';

-- Create function to calculate elemental damage modifier
CREATE OR REPLACE FUNCTION public.calculate_element_damage_modifier(
  p_attacker_faction TEXT,
  p_defender_element TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_faction_element RECORD;
  v_modifier NUMERIC := 1.0;
BEGIN
  -- Get attacker's elemental info
  SELECT * INTO v_faction_element
  FROM faction_elements
  WHERE faction_name = p_attacker_faction;
  
  -- If faction not found or defender is neutral, no modifier
  IF v_faction_element IS NULL OR p_defender_element = 'neutral' THEN
    RETURN 1.0;
  END IF;
  
  -- Check if strong against defender element (+20% damage)
  IF v_faction_element.strong_against = p_defender_element THEN
    v_modifier := 1.0 + v_faction_element.damage_bonus;
  -- Check if weak against defender element (-20% damage)
  ELSIF v_faction_element.weak_against = p_defender_element THEN
    v_modifier := 1.0 - v_faction_element.damage_penalty;
  END IF;
  
  RETURN v_modifier;
END;
$$;