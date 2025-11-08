-- Добавляем поле required_defeated_monsters в таблицу card_upgrade_requirements
ALTER TABLE card_upgrade_requirements
ADD COLUMN required_defeated_monsters integer DEFAULT 0 NOT NULL;

-- Добавляем комментарий для документации
COMMENT ON COLUMN card_upgrade_requirements.required_defeated_monsters IS 'Минимальное количество побежденных монстров, необходимое для улучшения карточки';