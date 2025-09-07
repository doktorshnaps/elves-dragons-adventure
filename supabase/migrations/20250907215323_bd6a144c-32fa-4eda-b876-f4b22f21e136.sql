-- Пополняем баланс профиля mr_bruts.tg на 300 ELL
UPDATE game_data 
SET balance = balance + 300, 
    updated_at = now()
WHERE wallet_address = 'mr_bruts.tg';

-- Если записи еще нет, создаем новую с начальным балансом 400 (100 + 300)
INSERT INTO game_data (wallet_address, balance, user_id)
SELECT 'mr_bruts.tg', 400, 'ffa08fc3-1891-47ae-aeee-bec179a0bfaa'
WHERE NOT EXISTS (SELECT 1 FROM game_data WHERE wallet_address = 'mr_bruts.tg');