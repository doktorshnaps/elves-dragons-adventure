-- Fix the specific Мастер Целитель card with incorrect stats
UPDATE public.card_instances ci
SET
  max_power = ct.power,
  max_defense = ct.defense,
  max_health = ct.health,
  max_magic = ct.magic,
  current_health = LEAST(ci.current_health, ct.health),
  current_defense = LEAST(ci.current_defense, ct.defense),
  card_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          ci.card_data,
          '{power}', to_jsonb(ct.power)
        ),
        '{defense}', to_jsonb(ct.defense)
      ),
      '{health}', to_jsonb(ct.health)
    ),
    '{magic}', to_jsonb(ct.magic)
  ),
  updated_at = now()
FROM public.card_templates ct
WHERE ci.id = '5d7383ae-7869-46fc-845d-5612ca206375'
  AND ct.card_name = ci.card_data->>'name'
  AND ct.card_type = ci.card_type
  AND ct.rarity = (ci.card_data->>'rarity')::integer
  AND ct.faction = ci.card_data->>'faction';