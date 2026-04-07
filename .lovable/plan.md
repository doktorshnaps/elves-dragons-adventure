
# Исправление активации кнопки «Быстрый бой» через отдельную таблицу подтвержденных держателей NFT

## Что реально сломано сейчас

Я проверил текущую логику и данные:

- `whitelist_contracts` уже содержит активный контракт `golden_ticket.nfts.tg`
- но `useGoldenTicketCheck` активирует кнопку только если находит NFT в:
  - `user_nft_cards`
  - или `card_instances`
- у `mr_bruts.tg` нет записей в `user_nft_cards` для `golden_ticket.nfts.tg`
- в `card_instances` у `mr_bruts.tg` записи есть, но у них `nft_contract_id = null`

Итог: сама проверка кнопки смотрит в таблицы, которые сейчас не являются надежным источником прав доступа.

## Важное решение

Использовать `whitelist_contracts` напрямую для определения, есть ли NFT у игрока, нельзя:  
эта таблица хранит только список разрешенных контрактов, а не список кошельков-владельцев.

Поэтому правильный путь такой:

1. `whitelist_contracts` = какие контракты дают доступ
2. новая таблица = какие кошельки уже подтверждены как держатели NFT из этих контрактов
3. отдельная проверка через edge function = проверяет кошелек в NEAR и обновляет новую таблицу

## Что нужно построить

### 1) Новая таблица в БД

Создать универсальную таблицу, например `wallet_whitelist_nft_access`:

- `id`
- `wallet_address text`
- `contract_id text`
- `has_access boolean`
- `token_count integer default 0`
- `token_ids jsonb default '[]'`
- `last_verified_at timestamptz`
- `verification_source text default 'near_rpc'`
- `error_message text null`
- `created_at`
- `updated_at`

Ограничения и индексы:

- `unique(wallet_address, contract_id)`
- индекс по `wallet_address`
- индекс по `contract_id`
- индекс по `(wallet_address, contract_id, has_access)`

### 2) Политики доступа

RLS для новой таблицы:

- пользователь может читать только свои записи
- прямые `insert/update/delete` с клиента запрещены
- запись в таблицу делает только edge function через service role

Это безопасно и не даст одному игроку видеть статусы другого.

### 3) Новая edge function для проверки NFT

Создать отдельную функцию, например:

- `refresh-wallet-whitelist-access`

Логика функции:

1. принимает `wallet_address`
2. читает из `whitelist_contracts` все `is_active = true`
3. для каждого контракта вызывает NEAR RPC `nft_tokens_for_owner`
4. если у кошелька найден хотя бы 1 токен:
   - `has_access = true`
   - сохраняет `token_count`
   - по возможности `token_ids`
5. если токенов нет:
   - `has_access = false`
6. делает `upsert` в `wallet_whitelist_nft_access`
7. возвращает результат по контрактам, включая `golden_ticket.nfts.tg`

Важно: для проверки доступа достаточно запрашивать `limit: 1`, но для диагностики можно сохранить фактическое количество, если RPC это позволяет без лишней нагрузки.

## Почему это лучше текущей схемы

Сейчас доступ к кнопке зависит от общего NFT-sync пайплайна, который у вас ломается отдельно.  
После изменений:

- право на «Быстрый бой» станет независимым от загрузки игровых NFT-карт
- таблица будет хранить уже подтвержденный результат проверки
- кнопка сможет активироваться даже если `user_nft_cards`/`card_instances` не успели заполниться или сломались

## Какие файлы менять

### База данных
- новая migration:
  - создание `wallet_whitelist_nft_access`
  - индексы
  - RLS policies
  - trigger `updated_at`

### Edge Function
- `supabase/functions/refresh-wallet-whitelist-access/index.ts`

### Frontend

#### `src/hooks/useGoldenTicketCheck.ts`
Переписать логику:

- сначала брать активность контракта из `whitelist_contracts`
- затем читать `wallet_whitelist_nft_access` по:
  - `accountId`
  - `nearAccountId`
- если записи нет или она устарела, вызвать `refresh-wallet-whitelist-access`
- после ответа перечитать таблицу
- подписаться через realtime уже на `wallet_whitelist_nft_access`, а не на `user_nft_cards/card_instances`

Возвращать не только:
- `hasGoldenTicket`
- `isLoading`

но и, желательно:
- `isChecking`
- `lastVerifiedAt`

#### `src/components/game/battle/TeamBattleArena.tsx`
Оставить кнопку всегда видимой, но улучшить состояния:

- `active` — если `hasGoldenTicket = true`
- `loading` — если идет проверка
- `disabled` — если доступа нет

Подсказка должна работать не на disabled-кнопке напрямую, а через wrapper `span` + tooltip trigger, чтобы hover стабильно срабатывал.

Тексты:
- загрузка: `Проверка Golden Ticket...`
- нет доступа: `Требуется Golden Ticket NFT`

#### `src/components/game/battle/TeamBattlePage.tsx`
Без большой логики:
- использовать обновленный хук
- передавать в арену `hasGoldenTicket` и `isCheckingGoldenTicket`

### Опционально, но полезно
#### `src/components/nft/NFTBackgroundSync.tsx`
После подключения кошелька дополнительно запускать `refresh-wallet-whitelist-access`, чтобы доступ прогревался заранее, а не только при входе в подземелье.

## Поток работы после исправления

```text
Кошелек подключен
  -> useGoldenTicketCheck читает whitelist_contracts
  -> читает wallet_whitelist_nft_access
  -> если записи нет/устарела:
       вызывает refresh-wallet-whitelist-access
          -> edge function проверяет NEAR RPC
          -> upsert в wallet_whitelist_nft_access
  -> hook перечитывает таблицу
  -> кнопка становится активной
```

## Что именно будет считаться “устаревшей” проверкой

Рекомендую TTL 5–10 минут:

- если `last_verified_at` свежее TTL, брать запись из таблицы без повторного RPC
- если старее, делать фоновую перепроверку

Это снизит нагрузку и сохранит отзывчивость.

## Как проверить после внедрения

1. Подключить кошелек `mr_bruts.tg`
2. Открыть подземелье
3. Убедиться, что в `wallet_whitelist_nft_access` появилась запись:
   - `wallet_address = mr_bruts.tg`
   - `contract_id = golden_ticket.nfts.tg`
   - `has_access = true`
4. Проверить, что кнопка:
   - видна сразу
   - сначала может показать состояние проверки
   - затем становится активной
5. Проверить случай без NFT:
   - кнопка остается серой
   - tooltip показывает `Требуется Golden Ticket NFT`

## Ключевой итог

Да, отдельная таблица здесь уместна, но не как ручной список адресов.  
Она должна быть кэшем подтвержденного владения NFT, который наполняется автоматически после on-chain проверки по активным контрактам из `whitelist_contracts`.

Это даст:
- надежную активацию кнопки
- независимость от общего NFT sync
- масштабируемость для других NFT-gated функций в будущем
