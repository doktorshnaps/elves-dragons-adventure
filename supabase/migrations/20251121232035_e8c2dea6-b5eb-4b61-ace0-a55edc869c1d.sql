-- Миграция карточек из game_data.cards в card_instances
-- Эта функция создаст экземпляры карт для всех игроков, у которых есть карты в game_data.cards но нет в card_instances

CREATE OR REPLACE FUNCTION public.migrate_cards_to_instances()
RETURNS TABLE(result_wallet text, migrated_cards integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_game_record RECORD;
  v_card jsonb;
  v_card_id text;
  v_card_type text;
  v_card_health integer;
  v_card_defense integer;
  v_migrated_count integer := 0;
  v_total_migrated integer := 0;
BEGIN
  -- Проходим по всем игрокам с карточками
  FOR v_game_record IN 
    SELECT gd.wallet_address, gd.cards
    FROM game_data gd
    WHERE gd.wallet_address IS NOT NULL 
      AND gd.cards IS NOT NULL
      AND jsonb_array_length(gd.cards) > 0
  LOOP
    v_migrated_count := 0;
    
    -- Проходим по каждой карточке в JSON
    FOR v_card IN SELECT * FROM jsonb_array_elements(v_game_record.cards)
    LOOP
      -- Извлекаем данные карточки
      v_card_id := v_card->>'id';
      v_card_type := v_card->>'type';
      v_card_health := COALESCE((v_card->>'health')::integer, 100);
      v_card_defense := COALESCE((v_card->>'defense')::integer, 0);
      
      -- Пропускаем рабочих
      IF v_card_type = 'workers' THEN
        CONTINUE;
      END IF;
      
      -- Проверяем, существует ли уже экземпляр
      IF NOT EXISTS (
        SELECT 1 FROM card_instances ci
        WHERE ci.wallet_address = v_game_record.wallet_address 
          AND ci.card_template_id = v_card_id
      ) THEN
        -- Создаем новый экземпляр
        INSERT INTO card_instances (
          wallet_address,
          card_template_id,
          card_type,
          card_data,
          current_health,
          max_health,
          current_defense,
          max_defense,
          monster_kills,
          last_heal_time
        ) VALUES (
          v_game_record.wallet_address,
          v_card_id,
          CASE 
            WHEN v_card_type = 'character' THEN 'hero'::text
            WHEN v_card_type = 'pet' THEN 'dragon'::text
            ELSE v_card_type
          END,
          v_card,
          COALESCE((v_card->>'currentHealth')::integer, v_card_health),
          v_card_health,
          COALESCE((v_card->>'currentDefense')::integer, v_card_defense),
          v_card_defense,
          0,
          now()
        );
        
        v_migrated_count := v_migrated_count + 1;
      END IF;
    END LOOP;
    
    IF v_migrated_count > 0 THEN
      v_total_migrated := v_total_migrated + v_migrated_count;
      result_wallet := v_game_record.wallet_address;
      migrated_cards := v_migrated_count;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed: % total cards migrated', v_total_migrated;
  RETURN;
END;
$$;

-- Запускаем миграцию
SELECT * FROM public.migrate_cards_to_instances();

-- Создаем RPC для ручного запуска миграции администратором
CREATE OR REPLACE FUNCTION public.admin_migrate_cards_to_instances(p_admin_wallet text DEFAULT NULL)
RETURNS TABLE(result_wallet text, migrated_cards integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Проверка прав администратора
  IF p_admin_wallet IS NOT NULL AND NOT public.is_admin_or_super_wallet(p_admin_wallet) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  RETURN QUERY SELECT * FROM public.migrate_cards_to_instances();
END;
$$;