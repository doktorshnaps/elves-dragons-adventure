-- Удаляем рабочих из инвентаря, которых нет в card_instances
DO $$
DECLARE
    wallet_addr TEXT := 'mr_bruts.tg';
    current_inventory JSONB;
    updated_inventory JSONB := '[]'::jsonb;
    inventory_item JSONB;
    existing_worker_ids TEXT[];
BEGIN
    -- Получаем ID рабочих из card_instances
    SELECT ARRAY(
        SELECT card_template_id 
        FROM card_instances 
        WHERE wallet_address = wallet_addr 
        AND card_type = 'workers'
    ) INTO existing_worker_ids;
    
    RAISE NOTICE 'Found % existing worker IDs in card_instances: %', 
        array_length(existing_worker_ids, 1), existing_worker_ids;
    
    -- Получаем текущий инвентарь
    SELECT inventory INTO current_inventory 
    FROM game_data 
    WHERE wallet_address = wallet_addr;
    
    -- Фильтруем инвентарь, удаляя рабочих которых нет в card_instances
    FOR inventory_item IN SELECT * FROM jsonb_array_elements(current_inventory)
    LOOP
        -- Если это не рабочий или рабочий есть в card_instances - оставляем
        IF (inventory_item->>'type') != 'worker' OR 
           (inventory_item->>'id') = ANY(existing_worker_ids) THEN
            updated_inventory := updated_inventory || jsonb_build_array(inventory_item);
        ELSE
            RAISE NOTICE 'Removing worker from inventory: % (id: %)', 
                inventory_item->>'name', inventory_item->>'id';
        END IF;
    END LOOP;
    
    -- Обновляем инвентарь
    UPDATE game_data 
    SET inventory = updated_inventory,
        updated_at = now()
    WHERE wallet_address = wallet_addr;
    
    RAISE NOTICE 'Inventory updated. Items remaining: %', jsonb_array_length(updated_inventory);
END $$;