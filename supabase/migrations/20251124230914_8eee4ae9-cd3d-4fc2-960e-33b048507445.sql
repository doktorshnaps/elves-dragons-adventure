-- Миграция карточек для всех игроков из game_data в card_instances

DO $$
DECLARE
  player_record RECORD;
  migration_result jsonb;
  total_inserted integer := 0;
  total_skipped integer := 0;
BEGIN
  -- Перебираем всех игроков, у которых есть карточки в game_data
  FOR player_record IN 
    SELECT wallet_address, cards
    FROM public.game_data
    WHERE cards IS NOT NULL 
      AND jsonb_array_length(cards::jsonb) > 0
  LOOP
    -- Вызываем функцию миграции для каждого игрока
    SELECT public.migrate_cards_to_instances(player_record.wallet_address) INTO migration_result;
    
    -- Суммируем результаты
    total_inserted := total_inserted + (migration_result->>'inserted_count')::integer;
    total_skipped := total_skipped + (migration_result->>'skipped_count')::integer;
    
    RAISE NOTICE 'Migrated cards for wallet %: inserted %, skipped %', 
      player_record.wallet_address, 
      migration_result->>'inserted_count',
      migration_result->>'skipped_count';
  END LOOP;
  
  RAISE NOTICE 'Total migration complete: inserted % cards, skipped % cards', total_inserted, total_skipped;
END $$;