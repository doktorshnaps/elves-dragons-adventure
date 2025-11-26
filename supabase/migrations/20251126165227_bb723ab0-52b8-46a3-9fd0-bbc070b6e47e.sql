-- Добавляем столбцы max_power и max_magic в таблицу card_instances
ALTER TABLE public.card_instances 
ADD COLUMN IF NOT EXISTS max_power integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_magic integer NOT NULL DEFAULT 0;

-- Пересчитываем и обновляем max_power и max_magic для всех существующих карт
UPDATE public.card_instances ci
SET 
  max_power = FLOOR(
    CASE 
      WHEN ci.card_type = 'hero' THEN 
        20 * COALESCE((SELECT multiplier FROM rarity_multipliers WHERE rarity = (ci.card_data->>'rarity')::integer), 1.0) *
        COALESCE((SELECT power_multiplier FROM class_multipliers WHERE class_name = ci.card_data->>'cardClass'), 1.0)
      WHEN ci.card_type = 'dragon' THEN 
        25 * COALESCE((SELECT multiplier FROM rarity_multipliers WHERE rarity = (ci.card_data->>'rarity')::integer), 1.0) *
        COALESCE((SELECT power_multiplier FROM dragon_class_multipliers WHERE class_name = ci.card_data->>'cardClass'), 1.0)
      ELSE 0
    END
  ),
  max_magic = FLOOR(
    CASE 
      WHEN ci.card_type = 'hero' THEN 
        15 * COALESCE((SELECT multiplier FROM rarity_multipliers WHERE rarity = (ci.card_data->>'rarity')::integer), 1.0) *
        COALESCE((SELECT magic_multiplier FROM class_multipliers WHERE class_name = ci.card_data->>'cardClass'), 1.0)
      WHEN ci.card_type = 'dragon' THEN 
        30 * COALESCE((SELECT multiplier FROM rarity_multipliers WHERE rarity = (ci.card_data->>'rarity')::integer), 1.0) *
        COALESCE((SELECT magic_multiplier FROM dragon_class_multipliers WHERE class_name = ci.card_data->>'cardClass'), 1.0)
      ELSE 0
    END
  )
WHERE ci.card_type IN ('hero', 'dragon');

-- Обновляем card_data JSON, добавляя туда power, health, magic и defense если их нет
UPDATE public.card_instances ci
SET card_data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        ci.card_data::jsonb,
        '{power}',
        to_jsonb(ci.max_power)
      ),
      '{health}',
      to_jsonb(ci.max_health)
    ),
    '{magic}',
    to_jsonb(ci.max_magic)
  ),
  '{defense}',
  to_jsonb(ci.max_defense)
)
WHERE ci.card_type IN ('hero', 'dragon');