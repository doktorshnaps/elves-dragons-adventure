-- Fix using Russian faction names
-- Элленар: Свет - силен против Тьмы, слаб против Земли
UPDATE public.faction_elements 
SET weak_against = 'earth' 
WHERE faction_name = 'Элленар';

-- Тэлэрион: Тьма - силен против Света, слаб против Огня
UPDATE public.faction_elements 
SET weak_against = 'fire' 
WHERE faction_name = 'Тэлэрион';