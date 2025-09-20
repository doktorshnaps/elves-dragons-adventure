-- Создаем записи card_instances для рабочих из инвентаря
-- Функция для создания card_instances для рабочих

DO $$
DECLARE
    worker_item JSONB;
    inventory_data JSONB;
    wallet_addr TEXT := 'mr_bruts.tg';
    user_id_val UUID;
BEGIN
    -- Получаем user_id для кошелька
    SELECT user_id INTO user_id_val 
    FROM game_data 
    WHERE wallet_address = wallet_addr;
    
    IF user_id_val IS NULL THEN
        RAISE EXCEPTION 'User not found for wallet: %', wallet_addr;
    END IF;
    
    -- Получаем инвентарь
    SELECT inventory INTO inventory_data 
    FROM game_data 
    WHERE wallet_address = wallet_addr;
    
    -- Обрабатываем каждый предмет в инвентаре
    FOR worker_item IN SELECT * FROM jsonb_array_elements(inventory_data)
    LOOP
        -- Проверяем, что это рабочий
        IF (worker_item->>'type') = 'worker' THEN
            -- Проверяем, нет ли уже экземпляра для этого рабочего
            IF NOT EXISTS (
                SELECT 1 FROM card_instances 
                WHERE wallet_address = wallet_addr 
                AND card_template_id = (worker_item->>'id')
            ) THEN
                -- Создаем экземпляр карты для рабочего
                INSERT INTO card_instances (
                    user_id,
                    wallet_address,
                    card_template_id,
                    card_type,
                    current_health,
                    max_health,
                    last_heal_time,
                    card_data
                ) VALUES (
                    user_id_val,
                    wallet_addr,
                    worker_item->>'id',
                    'workers',
                    100, -- базовое здоровье рабочих
                    100, -- максимальное здоровье рабочих
                    now(),
                    worker_item
                );
                
                RAISE NOTICE 'Created card_instance for worker: % (id: %)', 
                    worker_item->>'name', worker_item->>'id';
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed creating card_instances for workers';
END $$;