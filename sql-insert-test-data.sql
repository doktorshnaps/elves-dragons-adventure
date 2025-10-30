-- Обновляем card_upgrade_requirements реальными предметами
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "wood_chunks", "name": "Древесные чурки", "quantity": 2}]'::jsonb WHERE card_type = 'hero' AND rarity = 'common';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "rock_stones", "name": "Камни горной породы", "quantity": 3}, {"item_id": "wood_chunks", "name": "Древесные чурки", "quantity": 3}]'::jsonb WHERE card_type = 'hero' AND rarity = 'uncommon';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_fang", "name": "Клык паука", "quantity": 5}, {"item_id": "rock_stones", "name": "Камни горной породы", "quantity": 5}]'::jsonb WHERE card_type = 'hero' AND rarity = 'rare';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_venom", "name": "Яд паука", "quantity": 3}, {"item_id": "spider_fang", "name": "Клык паука", "quantity": 8}]'::jsonb WHERE card_type = 'hero' AND rarity = 'epic';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_eye", "name": "Глаз паука", "quantity": 2}, {"item_id": "spider_venom", "name": "Яд паука", "quantity": 5}]'::jsonb WHERE card_type = 'hero' AND rarity = 'legendary';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_silk", "name": "Паутина", "quantity": 10}, {"item_id": "spider_eye", "name": "Глаз паука", "quantity": 3}]'::jsonb WHERE card_type = 'hero' AND rarity = 'mythic';

UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "wood_chunks", "name": "Древесные чурки", "quantity": 3}]'::jsonb WHERE card_type = 'dragon' AND rarity = 'common';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_fang", "name": "Клык паука", "quantity": 4}, {"item_id": "rock_stones", "name": "Камни горной породы", "quantity": 3}]'::jsonb WHERE card_type = 'dragon' AND rarity = 'uncommon';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_venom", "name": "Яд паука", "quantity": 2}, {"item_id": "spider_fang", "name": "Клык паука", "quantity": 6}]'::jsonb WHERE card_type = 'dragon' AND rarity = 'rare';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_eye", "name": "Глаз паука", "quantity": 1}, {"item_id": "spider_venom", "name": "Яд паука", "quantity": 4}]'::jsonb WHERE card_type = 'dragon' AND rarity = 'epic';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_silk", "name": "Паутина", "quantity": 5}, {"item_id": "spider_eye", "name": "Глаз паука", "quantity": 2}]'::jsonb WHERE card_type = 'dragon' AND rarity = 'legendary';
UPDATE card_upgrade_requirements SET required_items = '[{"item_id": "spider_silk", "name": "Паутина", "quantity": 8}, {"item_id": "spider_eye", "name": "Глаз паука", "quantity": 4}]'::jsonb WHERE card_type = 'dragon' AND rarity = 'mythic';

-- Добавляем тестовые рецепты крафта (используем реальные item_id из БД)
INSERT INTO crafting_recipes (recipe_name, result_item_id, result_quantity, required_materials, category, description, created_by_wallet_address) VALUES
('Укрепленный клык паука', (SELECT id FROM item_templates WHERE item_id = 'spider_fang' LIMIT 1), 1, '[{"item_id": "spider_fang", "quantity": 3}, {"item_id": "rock_stones", "quantity": 2}]'::jsonb, 'material', 'Объедините несколько клыков для создания улучшенного', 'mr_bruts.tg'),
('Концентрированный яд', (SELECT id FROM item_templates WHERE item_id = 'spider_venom' LIMIT 1), 1, '[{"item_id": "poison_gland", "quantity": 3}, {"item_id": "spider_fang", "quantity": 2}]'::jsonb, 'material', 'Выжмите яд из желез', 'mr_bruts.tg'),
('Глаз паука', (SELECT id FROM item_templates WHERE item_id = 'spider_eye' LIMIT 1), 1, '[{"item_id": "spider_limbs", "quantity": 5}, {"item_id": "spider_silk", "quantity": 3}]'::jsonb, 'material', 'Создайте магический глаз из частей паука', 'mr_bruts.tg'),
('Паутина высшего качества', (SELECT id FROM item_templates WHERE item_id = 'spider_silk' LIMIT 1), 2, '[{"item_id": "spider_limbs", "quantity": 4}]'::jsonb, 'material', 'Извлеките паутину из конечностей', 'mr_bruts.tg'),
('Укрепленные камни', (SELECT id FROM item_templates WHERE item_id = 'rock_stones' LIMIT 1), 3, '[{"item_id": "wood_chunks", "quantity": 5}]'::jsonb, 'material', 'Обработайте дерево для получения камней', 'mr_bruts.tg'),
('Клык берсерка', (SELECT id FROM item_templates WHERE item_id = 'berserker_fang' LIMIT 1), 1, '[{"item_id": "spider_fang", "quantity": 10}, {"item_id": "spider_venom", "quantity": 2}]'::jsonb, 'material', 'Усильте клык ядом', 'mr_bruts.tg'),
('Коготь охотника', (SELECT id FROM item_templates WHERE item_id = 'hunter_claw' LIMIT 1), 1, '[{"item_id": "spider_fang", "quantity": 5}, {"item_id": "spider_limbs", "quantity": 3}]'::jsonb, 'material', 'Создайте коготь из частей паука', 'mr_bruts.tg'),
('Железа концентрированного яда', (SELECT id FROM item_templates WHERE item_id = 'concentrated_poison_gland' LIMIT 1), 1, '[{"item_id": "poison_gland", "quantity": 5}, {"item_id": "spider_venom", "quantity": 1}]'::jsonb, 'material', 'Усильте железу ядом', 'mr_bruts.tg')
ON CONFLICT (recipe_name) DO UPDATE SET
  required_materials = EXCLUDED.required_materials,
  result_item_id = EXCLUDED.result_item_id,
  description = EXCLUDED.description;
