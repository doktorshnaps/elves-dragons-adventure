-- Создание экземпляров карт для всех существующих игроков
-- Это исправит проблему пустой таблицы card_instances

DO $$
DECLARE
    game_record RECORD;
    card_data jsonb;
    card_id text;
    card_type text;
    card_health integer;
BEGIN
    -- Проходим по всем записям с картами
    FOR game_record IN 
        SELECT wallet_address, cards 
        FROM public.game_data 
        WHERE jsonb_array_length(cards) > 0
    LOOP
        -- Проходим по всем картам игрока
        FOR card_data IN 
            SELECT jsonb_array_elements(game_record.cards)
        LOOP
            card_id := card_data->>'id';
            card_type := COALESCE(NULLIF(card_data->>'type',''), 'character');
            card_health := COALESCE((card_data->>'health')::integer, 0);
            
            -- Создаем экземпляр если его еще нет
            IF NOT EXISTS (
                SELECT 1 FROM public.card_instances 
                WHERE wallet_address = game_record.wallet_address 
                AND card_template_id = card_id
            ) THEN
                INSERT INTO public.card_instances (
                    wallet_address,
                    user_id,
                    card_template_id,
                    card_type,
                    current_health,
                    max_health,
                    last_heal_time,
                    card_data
                ) VALUES (
                    game_record.wallet_address,
                    NULL,
                    card_id,
                    CASE WHEN card_type = 'pet' THEN 'dragon' ELSE 'hero' END,
                    COALESCE((card_data->>'currentHealth')::integer, card_health),
                    card_health,
                    COALESCE(
                        to_timestamp((card_data->>'lastHealTime')::bigint / 1000.0),
                        now()
                    ),
                    card_data
                );
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Создание экземпляров карт завершено';
END $$;