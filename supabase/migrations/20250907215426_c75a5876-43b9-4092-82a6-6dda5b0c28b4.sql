-- Создаем запись игровых данных для профиля mr_bruts.tg с балансом 400 ELL
-- Используем случайный UUID для user_id, так как ссылка на auth.users недоступна
INSERT INTO game_data (
    user_id, 
    wallet_address, 
    balance, 
    cards, 
    initialized, 
    inventory, 
    dragon_eggs, 
    barracks_upgrades, 
    dragon_lair_upgrades, 
    account_level, 
    account_experience
)
SELECT 
    gen_random_uuid(),
    'mr_bruts.tg', 
    400, 
    '[]'::jsonb, 
    true, 
    '[]'::jsonb, 
    '[]'::jsonb, 
    '[]'::jsonb, 
    '[]'::jsonb, 
    1, 
    0
WHERE NOT EXISTS (SELECT 1 FROM game_data WHERE wallet_address = 'mr_bruts.tg');