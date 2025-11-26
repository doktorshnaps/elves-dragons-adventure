-- Миграция для обновления ID карт в game_data.cards и selectedTeam на UUID из card_instances
-- Это критично для корректной синхронизации здоровья и брони

CREATE OR REPLACE FUNCTION migrate_game_data_card_ids_to_uuid()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  game_record RECORD;
  updated_cards jsonb;
  updated_team jsonb;
  card_element jsonb;
  instance_record RECORD;
  card_name text;
  card_faction text;
  card_type text;
BEGIN
  RAISE NOTICE '🔄 Starting migration: updating card IDs to UUID in game_data';
  
  -- Проходим по всем записям game_data
  FOR game_record IN 
    SELECT id, wallet_address, cards, selected_team 
    FROM game_data 
    WHERE cards IS NOT NULL AND jsonb_array_length(cards) > 0
  LOOP
    updated_cards := '[]'::jsonb;
    
    -- Обновляем каждую карту в cards массиве
    FOR card_element IN SELECT * FROM jsonb_array_elements(game_record.cards)
    LOOP
      card_name := card_element->>'name';
      card_faction := card_element->>'faction';
      card_type := card_element->>'type';
      
      -- Ищем соответствующий card_instance по template_id + faction
      SELECT ci.id, ci.current_health, ci.current_defense, ci.max_defense, ci.card_data
      INTO instance_record
      FROM card_instances ci
      WHERE ci.wallet_address = game_record.wallet_address
        AND ci.card_template_id = (card_element->>'id')
        AND (ci.card_data->>'faction') = card_faction
        AND (ci.card_data->>'name') = card_name
      LIMIT 1;
      
      IF instance_record.id IS NOT NULL THEN
        -- Обновляем ID на UUID и добавляем instanceId
        card_element := jsonb_set(card_element, '{id}', to_jsonb(instance_record.id::text));
        card_element := jsonb_set(card_element, '{instanceId}', to_jsonb(instance_record.id::text));
        
        RAISE NOTICE '  ✅ Updated card: % (%) -> UUID: %', card_name, card_faction, substring(instance_record.id::text, 1, 8);
      ELSE
        RAISE NOTICE '  ⚠️ No instance found for card: % (%), keeping original ID', card_name, card_faction;
      END IF;
      
      updated_cards := updated_cards || jsonb_build_array(card_element);
    END LOOP;
    
    -- Обновляем selectedTeam
    IF game_record.selected_team IS NOT NULL AND jsonb_array_length(game_record.selected_team) > 0 THEN
      updated_team := '[]'::jsonb;
      
      FOR card_element IN SELECT * FROM jsonb_array_elements(game_record.selected_team)
      LOOP
        -- Обновляем hero
        IF card_element->'hero' IS NOT NULL THEN
          card_name := card_element->'hero'->>'name';
          card_faction := card_element->'hero'->>'faction';
          
          SELECT ci.id INTO instance_record
          FROM card_instances ci
          WHERE ci.wallet_address = game_record.wallet_address
            AND ci.card_template_id = (card_element->'hero'->>'id')
            AND (ci.card_data->>'faction') = card_faction
            AND (ci.card_data->>'name') = card_name
          LIMIT 1;
          
          IF instance_record.id IS NOT NULL THEN
            card_element := jsonb_set(card_element, '{hero,id}', to_jsonb(instance_record.id::text));
            card_element := jsonb_set(card_element, '{hero,instanceId}', to_jsonb(instance_record.id::text));
          END IF;
        END IF;
        
        -- Обновляем dragon
        IF card_element->'dragon' IS NOT NULL THEN
          card_name := card_element->'dragon'->>'name';
          card_faction := card_element->'dragon'->>'faction';
          
          SELECT ci.id INTO instance_record
          FROM card_instances ci
          WHERE ci.wallet_address = game_record.wallet_address
            AND ci.card_template_id = (card_element->'dragon'->>'id')
            AND (ci.card_data->>'faction') = card_faction
            AND (ci.card_data->>'name') = card_name
          LIMIT 1;
          
          IF instance_record.id IS NOT NULL THEN
            card_element := jsonb_set(card_element, '{dragon,id}', to_jsonb(instance_record.id::text));
            card_element := jsonb_set(card_element, '{dragon,instanceId}', to_jsonb(instance_record.id::text));
          END IF;
        END IF;
        
        updated_team := updated_team || jsonb_build_array(card_element);
      END LOOP;
      
      -- Сохраняем обновленную команду
      UPDATE game_data 
      SET selected_team = updated_team
      WHERE id = game_record.id;
    END IF;
    
    -- Сохраняем обновленные карты
    UPDATE game_data 
    SET cards = updated_cards
    WHERE id = game_record.id;
    
    RAISE NOTICE '✅ Migrated game_data for wallet: % (% cards)', game_record.wallet_address, jsonb_array_length(updated_cards);
  END LOOP;
  
  RAISE NOTICE '🎉 Migration complete: all card IDs updated to UUID';
END;
$$;

-- Запускаем миграцию
SELECT migrate_game_data_card_ids_to_uuid();