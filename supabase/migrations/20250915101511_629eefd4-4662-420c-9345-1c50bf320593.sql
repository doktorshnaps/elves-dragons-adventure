-- Удаление таблицы card_templates, так как она содержит неактуальные карты
-- с английскими именами и фракциями, которых нет в игре
-- Также удаляем связанные внешние ключи

-- Сначала удаляем внешний ключ из user_nft_cards
ALTER TABLE user_nft_cards DROP CONSTRAINT IF EXISTS user_nft_cards_card_template_name_fkey;

-- Удаляем таблицу card_templates
DROP TABLE IF EXISTS card_templates;