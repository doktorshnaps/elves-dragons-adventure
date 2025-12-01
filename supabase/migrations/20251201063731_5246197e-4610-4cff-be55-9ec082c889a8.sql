-- Fix: Add missing "Обычный" dragon templates to match Edge Function naming
-- The Edge function uses "Обычный" but DB has "Ординарный", causing 0 stats

-- First, check if we need to add Обычный dragons or rename Ординарный to Обычный
-- Since users see "Обычный" in UI, we'll add "Обычный" templates

INSERT INTO card_templates (card_name, card_type, faction, rarity, power, defense, health, magic)
VALUES
  -- Обычный dragons for all 7 factions (using same stats as Ординарный: classLevel 1)
  ('Обычный ледяной дракон', 'dragon', 'Каледор', 1, 37, 14, 260, 20),
  ('Обычный песчаный дракон', 'dragon', 'Сильванести', 1, 37, 14, 260, 20),
  ('Обычный водный дракон', 'dragon', 'Фаэлин', 1, 37, 14, 260, 20),
  ('Обычный светлый дракон', 'dragon', 'Элленар', 1, 37, 14, 260, 20),
  ('Обычный теневой дракон', 'dragon', 'Тэлэрион', 1, 37, 14, 260, 20),
  ('Обычный земной дракон', 'dragon', 'Аэлантир', 1, 37, 14, 260, 20),
  ('Обычный лесной дракон', 'dragon', 'Лиорас', 1, 37, 14, 260, 20)
ON CONFLICT (card_name, card_type, faction, rarity) DO UPDATE SET
  power = EXCLUDED.power,
  defense = EXCLUDED.defense,
  health = EXCLUDED.health,
  magic = EXCLUDED.magic;

-- Also update existing card_instances with 0 stats to use correct template stats
UPDATE card_instances ci
SET
  max_power = ct.power,
  max_defense = ct.defense,
  max_health = ct.health,
  max_magic = ct.magic,
  current_defense = ct.defense,
  current_health = ct.health
FROM card_templates ct
WHERE ci.max_power = 0
  AND ci.max_defense = 0
  AND ci.max_magic = 0
  AND ci.card_data->>'name' = ct.card_name
  AND ci.card_type = ct.card_type
  AND ci.card_data->>'faction' = ct.faction
  AND ct.rarity = 1;