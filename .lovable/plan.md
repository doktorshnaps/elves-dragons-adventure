

## Карточки не грузятся: оптимизированная RPC ссылается на несуществующую колонку

### Диагноз

В консоли пользователя:
```
❌ [useCardInstances] column ci.is_on_marketplace does not exist
```

После прошлого фикса фронт переключён на `get_card_instances_by_wallet_optimized`. Но тело функции содержит:
```sql
WHERE ci.wallet_address = p_wallet_address
  AND ci.is_on_marketplace IS NOT TRUE;
```

Колонки `is_on_marketplace` в таблице `public.card_instances` **нет** (проверено по `information_schema.columns`). Любой вызов RPC падает с `42703 undefined_column`, фронт показывает тост «Ошибка загрузки карт» и пустой список → у всех игроков 0 карт.

Это регрессия: оптимизированная RPC создавалась под будущую фичу маркетплейса, которая ещё не приехала схемой.

### Фикс

Одна SQL-миграция — пересоздать `get_card_instances_by_wallet_optimized` без условия `is_on_marketplace`:

```sql
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet_optimized(p_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ci.id,
      'user_id', ci.user_id,
      'wallet_address', ci.wallet_address,
      'card_template_id', ci.card_template_id,
      'card_type', ci.card_type,
      'current_health', ci.current_health,
      'max_health', ci.max_health,
      'current_defense', ci.current_defense,
      'max_defense', ci.max_defense,
      'max_power', ci.max_power,
      'max_magic', ci.max_magic,
      'last_heal_time', ci.last_heal_time,
      'is_in_medical_bay', ci.is_in_medical_bay,
      'medical_bay_start_time', ci.medical_bay_start_time,
      'medical_bay_heal_rate', ci.medical_bay_heal_rate,
      'monster_kills', ci.monster_kills,
      'card_data', ci.card_data,
      'created_at', ci.created_at,
      'updated_at', ci.updated_at,
      'nft_contract_id', ci.nft_contract_id,
      'nft_token_id', ci.nft_token_id,
      'template_info', CASE 
        WHEN ci.card_type = 'workers' AND it.id IS NOT NULL THEN
          jsonb_build_object(
            'id', it.id, 'item_id', it.item_id, 'name', it.name,
            'description', it.description, 'image_url', it.image_url,
            'stats', it.stats, 'value', it.value,
            'sell_price', it.sell_price, 'rarity', it.rarity
          )
        ELSE NULL
      END
    )
  )
  INTO v_result
  FROM card_instances ci
  LEFT JOIN item_templates it
    ON ci.card_type = 'workers' AND ci.card_template_id = it.item_id
  WHERE ci.wallet_address = p_wallet_address;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
```

Когда колонка `is_on_marketplace` реально появится в `card_instances` — фильтр можно будет вернуть отдельной миграцией.

### Что НЕ делаю

- Не трогаю фронт — он уже использует правильную RPC, проблема исключительно в SQL.
- Не откатываю переключение на оптимизированную RPC (старая всё равно режется лимитом 1000).
- Не добавляю колонку `is_on_marketplace` — нет фичи маркетплейса, это будет мёртвый код.

### Проверка

- Открыть `/team` → колоды героев и драконов снова показывают карты.
- В консоли отсутствует `column ci.is_on_marketplace does not exist`.
- У `s6aek3r.tg` стабильно 1006 героев / 1054 дракона (большая выборка через jsonb-RPC).

