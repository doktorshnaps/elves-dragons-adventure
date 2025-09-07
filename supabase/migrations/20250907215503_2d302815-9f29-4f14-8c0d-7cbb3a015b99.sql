-- Удаляем внешний ключ constraint на auth.users, чтобы можно было работать с кошельками без аутентификации
ALTER TABLE game_data DROP CONSTRAINT IF EXISTS game_data_user_id_fkey;

-- Теперь создаем запись для mr_bruts.tg с балансом 400 ELL
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
    'ffa08fc3-1891-47ae-aeee-bec179a0bfaa'::uuid,
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