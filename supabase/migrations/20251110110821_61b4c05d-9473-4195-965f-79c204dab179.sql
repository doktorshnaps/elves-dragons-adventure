-- Восстанавливаем данные игрока mcloven1.tg из card_instances
DO $$
DECLARE
  v_cards_from_instances jsonb;
BEGIN
  -- Собираем карты из card_instances
  SELECT COALESCE(jsonb_agg(card_data), '[]'::jsonb)
  INTO v_cards_from_instances
  FROM public.card_instances
  WHERE wallet_address = 'mcloven1.tg'
    AND card_data IS NOT NULL;

  -- Обновляем game_data с восстановленными картами и стартовым балансом
  UPDATE public.game_data
  SET
    cards = v_cards_from_instances,
    balance = 100, -- Даём стартовый баланс
    initialized = true,
    updated_at = now(),
    data_version = COALESCE(data_version, 1) + 1
  WHERE wallet_address = 'mcloven1.tg';

  RAISE LOG 'Restored % cards for mcloven1.tg from card_instances', jsonb_array_length(v_cards_from_instances);
END $$;