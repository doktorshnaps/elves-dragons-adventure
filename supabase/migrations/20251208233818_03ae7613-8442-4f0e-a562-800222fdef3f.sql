-- RPC функция для получения KPI метрик игры
CREATE OR REPLACE FUNCTION public.get_game_metrics(p_admin_wallet_address TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_players INTEGER;
  v_dau INTEGER;
  v_wau INTEGER;
  v_mau INTEGER;
  v_d1_retention NUMERIC;
  v_d7_retention NUMERIC;
  v_d30_retention NUMERIC;
  v_avg_session_minutes NUMERIC;
  v_total_ell_spent BIGINT;
  v_players_with_purchases INTEGER;
  v_conversion_rate NUMERIC;
  v_avg_dungeon_level NUMERIC;
  v_max_dungeon_level INTEGER;
  v_total_cards INTEGER;
  v_players_with_full_collection INTEGER;
  v_full_collection_rate NUMERIC;
  v_total_heroes INTEGER;
  v_total_dragons INTEGER;
  v_unique_card_types INTEGER;
  v_new_players_today INTEGER;
  v_new_players_week INTEGER;
  v_new_players_month INTEGER;
BEGIN
  -- Проверка прав администратора
  IF NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Общее количество игроков
  SELECT COUNT(*) INTO v_total_players FROM game_data WHERE initialized = true;

  -- DAU (активные за последние 24 часа)
  SELECT COUNT(*) INTO v_dau 
  FROM game_data 
  WHERE updated_at >= NOW() - INTERVAL '24 hours' AND initialized = true;

  -- WAU (активные за последние 7 дней)
  SELECT COUNT(*) INTO v_wau 
  FROM game_data 
  WHERE updated_at >= NOW() - INTERVAL '7 days' AND initialized = true;

  -- MAU (активные за последние 30 дней)
  SELECT COUNT(*) INTO v_mau 
  FROM game_data 
  WHERE updated_at >= NOW() - INTERVAL '30 days' AND initialized = true;

  -- D1 Retention (игроки, вернувшиеся через день после регистрации)
  SELECT COALESCE(
    (SELECT COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM game_data WHERE created_at < NOW() - INTERVAL '1 day'), 0) * 100
     FROM game_data 
     WHERE created_at < NOW() - INTERVAL '1 day' 
       AND updated_at > created_at + INTERVAL '20 hours'), 0
  ) INTO v_d1_retention;

  -- D7 Retention
  SELECT COALESCE(
    (SELECT COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM game_data WHERE created_at < NOW() - INTERVAL '7 days'), 0) * 100
     FROM game_data 
     WHERE created_at < NOW() - INTERVAL '7 days' 
       AND updated_at > created_at + INTERVAL '6 days'), 0
  ) INTO v_d7_retention;

  -- D30 Retention
  SELECT COALESCE(
    (SELECT COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM game_data WHERE created_at < NOW() - INTERVAL '30 days'), 0) * 100
     FROM game_data 
     WHERE created_at < NOW() - INTERVAL '30 days' 
       AND updated_at > created_at + INTERVAL '29 days'), 0
  ) INTO v_d30_retention;

  -- Среднее время сессии (на основе wallet_connections)
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(disconnected_at, NOW()) - connected_at)) / 60), 0)
  INTO v_avg_session_minutes
  FROM wallet_connections
  WHERE connected_at >= NOW() - INTERVAL '30 days';

  -- Общая сумма потраченных ELL (сумма балансов - начальный баланс 100)
  SELECT COALESCE(SUM(GREATEST(100 - balance, 0)), 0) INTO v_total_ell_spent FROM game_data WHERE initialized = true;

  -- Игроки с покупками (баланс меньше начального или есть предметы)
  SELECT COUNT(*) INTO v_players_with_purchases 
  FROM game_data gd
  WHERE gd.initialized = true 
    AND (gd.balance < 100 OR EXISTS (SELECT 1 FROM item_instances ii WHERE ii.wallet_address = gd.wallet_address));

  -- Конверсия в покупки
  SELECT CASE WHEN v_total_players > 0 THEN (v_players_with_purchases::NUMERIC / v_total_players * 100) ELSE 0 END 
  INTO v_conversion_rate;

  -- Средний уровень подземелья (из active_dungeon_sessions)
  SELECT COALESCE(AVG(level), 1), COALESCE(MAX(level), 1) 
  INTO v_avg_dungeon_level, v_max_dungeon_level
  FROM active_dungeon_sessions;

  -- Общее количество карт в игре
  SELECT COUNT(*) INTO v_total_cards FROM card_instances;
  SELECT COUNT(*) INTO v_total_heroes FROM card_instances WHERE card_type = 'character';
  SELECT COUNT(*) INTO v_total_dragons FROM card_instances WHERE card_type = 'pet';

  -- Уникальные типы карт
  SELECT COUNT(DISTINCT card_template_id) INTO v_unique_card_types FROM card_instances;

  -- Игроки с полной коллекцией (имеют все типы карт из card_templates)
  SELECT COUNT(*) INTO v_players_with_full_collection
  FROM (
    SELECT wallet_address
    FROM card_instances
    GROUP BY wallet_address
    HAVING COUNT(DISTINCT card_template_id) >= (SELECT COUNT(*) FROM card_templates)
  ) sub;

  SELECT CASE WHEN v_total_players > 0 THEN (v_players_with_full_collection::NUMERIC / v_total_players * 100) ELSE 0 END 
  INTO v_full_collection_rate;

  -- Новые игроки
  SELECT COUNT(*) INTO v_new_players_today FROM game_data WHERE created_at >= NOW() - INTERVAL '24 hours';
  SELECT COUNT(*) INTO v_new_players_week FROM game_data WHERE created_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_new_players_month FROM game_data WHERE created_at >= NOW() - INTERVAL '30 days';

  -- Формирование результата
  v_result := jsonb_build_object(
    'players', jsonb_build_object(
      'total', v_total_players,
      'dau', v_dau,
      'wau', v_wau,
      'mau', v_mau,
      'newToday', v_new_players_today,
      'newWeek', v_new_players_week,
      'newMonth', v_new_players_month
    ),
    'retention', jsonb_build_object(
      'd1', ROUND(v_d1_retention, 2),
      'd7', ROUND(v_d7_retention, 2),
      'd30', ROUND(v_d30_retention, 2)
    ),
    'engagement', jsonb_build_object(
      'avgSessionMinutes', ROUND(v_avg_session_minutes, 2),
      'dauMauRatio', CASE WHEN v_mau > 0 THEN ROUND((v_dau::NUMERIC / v_mau * 100), 2) ELSE 0 END
    ),
    'economy', jsonb_build_object(
      'totalEllSpent', v_total_ell_spent,
      'playersWithPurchases', v_players_with_purchases,
      'conversionRate', ROUND(v_conversion_rate, 2)
    ),
    'dungeons', jsonb_build_object(
      'avgLevel', ROUND(v_avg_dungeon_level, 2),
      'maxLevel', v_max_dungeon_level
    ),
    'cards', jsonb_build_object(
      'totalCards', v_total_cards,
      'totalHeroes', v_total_heroes,
      'totalDragons', v_total_dragons,
      'uniqueTypes', v_unique_card_types,
      'playersWithFullCollection', v_players_with_full_collection,
      'fullCollectionRate', ROUND(v_full_collection_rate, 2)
    ),
    'generatedAt', NOW()
  );

  RETURN v_result;
END;
$$;