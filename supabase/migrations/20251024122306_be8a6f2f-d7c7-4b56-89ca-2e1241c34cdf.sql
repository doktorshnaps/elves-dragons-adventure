-- Добавление начальных конфигураций для зданий Главный зал, Казармы, Мастерская, Медицинский пункт, Драконье логово

-- Главный зал (main_hall) - 8 уровней
INSERT INTO public.building_configs (
  building_id, building_name, level, 
  production_per_hour, cost_wood, cost_stone, cost_iron, cost_gold, cost_ell, cost_gt,
  required_items, required_main_hall_level, upgrade_time_hours, 
  storage_capacity, working_hours, is_active, created_by_wallet_address
) VALUES
  ('main_hall', 'Главный зал', 1, 0, 0, 0, 0, 0, 0, 0, '[]'::jsonb, 0, 1, 0, 0, true, 'system'),
  ('main_hall', 'Главный зал', 2, 0, 500, 500, 0, 0, 100, 0, '[]'::jsonb, 0, 2, 0, 0, true, 'system'),
  ('main_hall', 'Главный зал', 3, 0, 1000, 1000, 0, 0, 200, 0, '[]'::jsonb, 0, 3, 0, 0, true, 'system'),
  ('main_hall', 'Главный зал', 4, 0, 2000, 2000, 0, 0, 400, 0, '[]'::jsonb, 0, 4, 0, 0, true, 'system'),
  ('main_hall', 'Главный зал', 5, 0, 4000, 4000, 0, 0, 800, 0, '[]'::jsonb, 0, 5, 0, 0, true, 'system'),
  ('main_hall', 'Главный зал', 6, 0, 8000, 8000, 0, 0, 1600, 0, '[]'::jsonb, 0, 6, 0, 0, true, 'system'),
  ('main_hall', 'Главный зал', 7, 0, 16000, 16000, 0, 0, 3200, 0, '[]'::jsonb, 0, 7, 0, 0, true, 'system'),
  ('main_hall', 'Главный зал', 8, 0, 32000, 32000, 0, 0, 6400, 0, '[]'::jsonb, 0, 8, 0, 0, true, 'system')
ON CONFLICT (building_id, level) DO NOTHING;

-- Казармы (barracks) - 8 уровней
INSERT INTO public.building_configs (
  building_id, building_name, level, 
  production_per_hour, cost_wood, cost_stone, cost_iron, cost_gold, cost_ell, cost_gt,
  required_items, required_main_hall_level, upgrade_time_hours, 
  storage_capacity, working_hours, is_active, created_by_wallet_address
) VALUES
  ('barracks', 'Казармы', 1, 0, 0, 0, 0, 0, 0, 0, '[]'::jsonb, 1, 1, 0, 0, true, 'system'),
  ('barracks', 'Казармы', 2, 0, 600, 600, 0, 0, 400, 0, '[]'::jsonb, 2, 2, 0, 0, true, 'system'),
  ('barracks', 'Казармы', 3, 0, 1200, 1200, 0, 0, 800, 0, '[]'::jsonb, 3, 3, 0, 0, true, 'system'),
  ('barracks', 'Казармы', 4, 0, 2400, 2400, 0, 0, 1600, 0, '[]'::jsonb, 4, 4, 0, 0, true, 'system'),
  ('barracks', 'Казармы', 5, 0, 4800, 4800, 0, 0, 3200, 0, '[]'::jsonb, 5, 5, 0, 0, true, 'system'),
  ('barracks', 'Казармы', 6, 0, 9600, 9600, 0, 0, 6400, 0, '[]'::jsonb, 6, 6, 0, 0, true, 'system'),
  ('barracks', 'Казармы', 7, 0, 19200, 19200, 0, 0, 12800, 0, '[]'::jsonb, 7, 7, 0, 0, true, 'system'),
  ('barracks', 'Казармы', 8, 0, 38400, 38400, 0, 0, 25600, 0, '[]'::jsonb, 8, 8, 0, 0, true, 'system')
ON CONFLICT (building_id, level) DO NOTHING;

-- Мастерская (workshop) - 8 уровней
INSERT INTO public.building_configs (
  building_id, building_name, level, 
  production_per_hour, cost_wood, cost_stone, cost_iron, cost_gold, cost_ell, cost_gt,
  required_items, required_main_hall_level, upgrade_time_hours, 
  storage_capacity, working_hours, is_active, created_by_wallet_address
) VALUES
  ('workshop', 'Мастерская', 1, 0, 0, 0, 0, 0, 0, 0, '[]'::jsonb, 1, 1, 0, 0, true, 'system'),
  ('workshop', 'Мастерская', 2, 0, 400, 400, 0, 0, 100, 0, '[]'::jsonb, 1, 2, 0, 0, true, 'system'),
  ('workshop', 'Мастерская', 3, 0, 800, 800, 0, 0, 200, 0, '[]'::jsonb, 2, 3, 0, 0, true, 'system'),
  ('workshop', 'Мастерская', 4, 0, 1600, 1600, 0, 0, 400, 0, '[]'::jsonb, 3, 4, 0, 0, true, 'system'),
  ('workshop', 'Мастерская', 5, 0, 3200, 3200, 0, 0, 800, 0, '[]'::jsonb, 4, 5, 0, 0, true, 'system'),
  ('workshop', 'Мастерская', 6, 0, 6400, 6400, 0, 0, 1600, 0, '[]'::jsonb, 5, 6, 0, 0, true, 'system'),
  ('workshop', 'Мастерская', 7, 0, 12800, 12800, 0, 0, 3200, 0, '[]'::jsonb, 6, 7, 0, 0, true, 'system'),
  ('workshop', 'Мастерская', 8, 0, 25600, 25600, 0, 0, 6400, 0, '[]'::jsonb, 7, 8, 0, 0, true, 'system')
ON CONFLICT (building_id, level) DO NOTHING;

-- Медицинский пункт (medical) - 8 уровней
INSERT INTO public.building_configs (
  building_id, building_name, level, 
  production_per_hour, cost_wood, cost_stone, cost_iron, cost_gold, cost_ell, cost_gt,
  required_items, required_main_hall_level, upgrade_time_hours, 
  storage_capacity, working_hours, is_active, created_by_wallet_address
) VALUES
  ('medical', 'Медицинский пункт', 1, 0, 0, 0, 0, 0, 0, 0, '[]'::jsonb, 1, 1, 0, 0, true, 'system'),
  ('medical', 'Медицинский пункт', 2, 0, 300, 300, 0, 0, 50, 0, '[]'::jsonb, 1, 2, 0, 0, true, 'system'),
  ('medical', 'Медицинский пункт', 3, 0, 600, 600, 0, 0, 100, 0, '[]'::jsonb, 2, 3, 0, 0, true, 'system'),
  ('medical', 'Медицинский пункт', 4, 0, 1200, 1200, 0, 0, 200, 0, '[]'::jsonb, 3, 4, 0, 0, true, 'system'),
  ('medical', 'Медицинский пункт', 5, 0, 2400, 2400, 0, 0, 400, 0, '[]'::jsonb, 4, 5, 0, 0, true, 'system'),
  ('medical', 'Медицинский пункт', 6, 0, 4800, 4800, 0, 0, 800, 0, '[]'::jsonb, 5, 6, 0, 0, true, 'system'),
  ('medical', 'Медицинский пункт', 7, 0, 9600, 9600, 0, 0, 1600, 0, '[]'::jsonb, 6, 7, 0, 0, true, 'system'),
  ('medical', 'Медицинский пункт', 8, 0, 19200, 19200, 0, 0, 3200, 0, '[]'::jsonb, 7, 8, 0, 0, true, 'system')
ON CONFLICT (building_id, level) DO NOTHING;

-- Драконье логово (dragon_lair) - 8 уровней
INSERT INTO public.building_configs (
  building_id, building_name, level, 
  production_per_hour, cost_wood, cost_stone, cost_iron, cost_gold, cost_ell, cost_gt,
  required_items, required_main_hall_level, upgrade_time_hours, 
  storage_capacity, working_hours, is_active, created_by_wallet_address
) VALUES
  ('dragon_lair', 'Драконье логово', 1, 0, 0, 0, 0, 0, 0, 0, '[]'::jsonb, 1, 1, 0, 0, true, 'system'),
  ('dragon_lair', 'Драконье логово', 2, 0, 600, 600, 0, 0, 400, 0, '[]'::jsonb, 2, 2, 0, 0, true, 'system'),
  ('dragon_lair', 'Драконье логово', 3, 0, 1200, 1200, 0, 0, 800, 0, '[]'::jsonb, 3, 3, 0, 0, true, 'system'),
  ('dragon_lair', 'Драконье логово', 4, 0, 2400, 2400, 0, 0, 1600, 0, '[]'::jsonb, 4, 4, 0, 0, true, 'system'),
  ('dragon_lair', 'Драконье логово', 5, 0, 4800, 4800, 0, 0, 3200, 0, '[]'::jsonb, 5, 5, 0, 0, true, 'system'),
  ('dragon_lair', 'Драконье логово', 6, 0, 9600, 9600, 0, 0, 6400, 0, '[]'::jsonb, 6, 6, 0, 0, true, 'system'),
  ('dragon_lair', 'Драконье логово', 7, 0, 19200, 19200, 0, 0, 12800, 0, '[]'::jsonb, 7, 7, 0, 0, true, 'system'),
  ('dragon_lair', 'Драконье логово', 8, 0, 38400, 38400, 0, 0, 25600, 0, '[]'::jsonb, 8, 8, 0, 0, true, 'system')
ON CONFLICT (building_id, level) DO NOTHING;

-- Лесопилка (sawmill) - 8 уровней (на случай если тоже отсутствует)
INSERT INTO public.building_configs (
  building_id, building_name, level, 
  production_per_hour, cost_wood, cost_stone, cost_iron, cost_gold, cost_ell, cost_gt,
  required_items, required_main_hall_level, upgrade_time_hours, 
  storage_capacity, working_hours, is_active, created_by_wallet_address
) VALUES
  ('sawmill', 'Лесопилка', 1, 10, 0, 0, 0, 0, 0, 0, '[]'::jsonb, 0, 1, 0, 0, true, 'system'),
  ('sawmill', 'Лесопилка', 2, 20, 400, 300, 0, 0, 100, 0, '[]'::jsonb, 1, 2, 0, 0, true, 'system'),
  ('sawmill', 'Лесопилка', 3, 40, 800, 600, 0, 0, 200, 0, '[]'::jsonb, 2, 3, 0, 0, true, 'system'),
  ('sawmill', 'Лесопилка', 4, 80, 1600, 1200, 0, 0, 400, 0, '[]'::jsonb, 3, 4, 0, 0, true, 'system'),
  ('sawmill', 'Лесопилка', 5, 160, 3200, 2400, 0, 0, 800, 0, '[]'::jsonb, 4, 5, 0, 0, true, 'system'),
  ('sawmill', 'Лесопилка', 6, 320, 6400, 4800, 0, 0, 1600, 0, '[]'::jsonb, 5, 6, 0, 0, true, 'system'),
  ('sawmill', 'Лесопилка', 7, 640, 12800, 9600, 0, 0, 3200, 0, '[]'::jsonb, 6, 7, 0, 0, true, 'system'),
  ('sawmill', 'Лесопилка', 8, 1280, 25600, 19200, 0, 0, 6400, 0, '[]'::jsonb, 7, 8, 0, 0, true, 'system')
ON CONFLICT (building_id, level) DO NOTHING;

-- Каменоломня (quarry) - 8 уровней (на случай если тоже отсутствует)
INSERT INTO public.building_configs (
  building_id, building_name, level, 
  production_per_hour, cost_wood, cost_stone, cost_iron, cost_gold, cost_ell, cost_gt,
  required_items, required_main_hall_level, upgrade_time_hours, 
  storage_capacity, working_hours, is_active, created_by_wallet_address
) VALUES
  ('quarry', 'Каменоломня', 1, 10, 0, 0, 0, 0, 0, 0, '[]'::jsonb, 0, 1, 0, 0, true, 'system'),
  ('quarry', 'Каменоломня', 2, 20, 300, 400, 0, 0, 100, 0, '[]'::jsonb, 1, 2, 0, 0, true, 'system'),
  ('quarry', 'Каменоломня', 3, 40, 600, 800, 0, 0, 200, 0, '[]'::jsonb, 2, 3, 0, 0, true, 'system'),
  ('quarry', 'Каменоломня', 4, 80, 1200, 1600, 0, 0, 400, 0, '[]'::jsonb, 3, 4, 0, 0, true, 'system'),
  ('quarry', 'Каменоломня', 5, 160, 2400, 3200, 0, 0, 800, 0, '[]'::jsonb, 4, 5, 0, 0, true, 'system'),
  ('quarry', 'Каменоломня', 6, 320, 4800, 6400, 0, 0, 1600, 0, '[]'::jsonb, 5, 6, 0, 0, true, 'system'),
  ('quarry', 'Каменоломня', 7, 640, 9600, 12800, 0, 0, 3200, 0, '[]'::jsonb, 6, 7, 0, 0, true, 'system'),
  ('quarry', 'Каменоломня', 8, 1280, 19200, 25600, 0, 0, 6400, 0, '[]'::jsonb, 7, 8, 0, 0, true, 'system')
ON CONFLICT (building_id, level) DO NOTHING;