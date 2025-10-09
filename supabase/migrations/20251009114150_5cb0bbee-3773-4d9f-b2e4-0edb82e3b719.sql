-- One-time data fix: Update max_health for cards that have incorrect values
-- This fixes cards where max_health was set to currentHealth instead of actual max health

UPDATE card_instances ci
SET 
  max_health = GREATEST(
    (ci.card_data->>'health')::integer,
    ci.current_health,
    10
  ),
  current_health = LEAST(ci.current_health, GREATEST((ci.card_data->>'health')::integer, 10)),
  updated_at = now()
WHERE ci.max_health < 100
  OR ci.current_health > ci.max_health;