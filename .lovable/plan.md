

## Пуш-уведомления в Telegram о событиях в игре

### Архитектура

Приложение уже работает как Telegram Mini App. У пользователя `window.Telegram.WebApp.initDataUnsafe.user.id` содержит Telegram chat_id. Нужно:

1. Сохранять `telegram_chat_id` каждого игрока в БД (привязка к `wallet_address`)
2. Создать Edge Function `send-telegram-notification`, которая шлёт сообщение через Telegram Bot API
3. Вызывать эту функцию из существующих мест завершения событий (стройка, крафт, лечение)
4. Для ивента «Искатели» — создать pg_cron задачу, которая при старте нового ивента рассылает уведомления всем игрокам

### Требования

- Токен бота Mini App нужно добавить как секрет `TELEGRAM_BOT_TOKEN`
- Бот может отправлять сообщения только тем пользователям, которые хотя бы раз взаимодействовали с ним (запускали Mini App)

### Детали реализации

**1. Миграция БД — сохранение telegram_chat_id**

Добавить колонку `telegram_chat_id bigint` в таблицу `game_data`. Обновлять её при каждом входе игрока через Mini App.

```sql
ALTER TABLE public.game_data ADD COLUMN IF NOT EXISTS telegram_chat_id bigint;
CREATE INDEX IF NOT EXISTS idx_game_data_tg_chat ON public.game_data(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
```

**2. Сохранение chat_id при входе**

В `src/contexts/WalletConnectContext.tsx` или `useGameData` — после инициализации, если `window.Telegram?.WebApp?.initDataUnsafe?.user?.id` существует, вызывать RPC для сохранения:

```sql
CREATE OR REPLACE FUNCTION public.save_telegram_chat_id(p_wallet_address text, p_chat_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE game_data SET telegram_chat_id = p_chat_id WHERE wallet_address = p_wallet_address;
END;
$$;
```

Вызов из клиента: `supabase.rpc('save_telegram_chat_id', { p_wallet_address: accountId, p_chat_id: tgUser.id })`

**3. Edge Function `send-telegram-notification`**

Принимает `wallet_address` и `message` (текст). Ищет `telegram_chat_id` в `game_data`, шлёт через `https://api.telegram.org/bot{TOKEN}/sendMessage`.

```
supabase/functions/send-telegram-notification/index.ts
```

Используется `TELEGRAM_BOT_TOKEN` (секрет) и `SUPABASE_SERVICE_ROLE_KEY` для чтения chat_id из БД.

**4. Триггерные точки — откуда вызывать уведомления**

| Событие | Где срабатывает | Как вызывать |
|---------|----------------|-------------|
| Постройка здания готова | `useBuildingUpgrades.ts` — auto-transition effect (status → ready) | `supabase.functions.invoke('send-telegram-notification', { body: { wallet_address, message } })` |
| Крафт завершён | `useShelterState.ts` — `checkCraftingCompletion` (строка ~714) | Аналогично |
| Лечение завершено | `useMedicalBay.ts` — при `is_completed = true` | Аналогично |
| Новый ивент Искатели | Админ создаёт ивент → триггер в БД или pg_cron | Edge Function `notify-seekers-event` — массовая рассылка |

**5. Массовая рассылка при старте ивента Искатели**

Создать отдельную Edge Function `notify-seekers-event`, которая:
- Берёт всех игроков с непустым `telegram_chat_id`
- Шлёт каждому сообщение о новом ивенте
- Вызывается вручную из админки или через триггер при INSERT в таблицу ивентов

**6. Защита от спама**

- Уведомления отправляются только серверно (Edge Function), клиент не может напрямую слать сообщения
- Rate limiting: не более 1 уведомления в минуту на пользователя (проверка в Edge Function)
- Telegram API лимит: 30 сообщений/сек, при массовой рассылке — задержка между сообщениями

### Файлы для создания/изменения

- **Новые**: `supabase/functions/send-telegram-notification/index.ts`, `supabase/functions/notify-seekers-event/index.ts`
- **Миграция**: колонка `telegram_chat_id` + RPC `save_telegram_chat_id`
- **Изменения**: `src/hooks/useBuildingUpgrades.ts`, `src/hooks/shelter/useShelterState.ts`, `src/hooks/useMedicalBay.ts`, `src/hooks/useGameData.ts` (или WalletConnectContext)
- **Секрет**: `TELEGRAM_BOT_TOKEN` — нужно добавить перед реализацией

### Порядок

1. Добавить секрет `TELEGRAM_BOT_TOKEN`
2. Миграция БД
3. Сохранение chat_id при входе
4. Edge Function для отправки
5. Интеграция в триггерные точки
6. Edge Function для массовой рассылки Искателей

