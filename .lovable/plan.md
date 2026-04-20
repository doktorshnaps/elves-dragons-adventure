

## «Искатели»: событие не завершается по таймеру, таймер «начинается заново»

### Корень проблемы

В `src/pages/Seekers.tsx` функция `endEvent` пытается закрыть событие напрямую через клиентский UPDATE:

```ts
await supabase.from('treasure_hunt_events')
  .update({ is_active: false, ended_at: new Date().toISOString() })
  .eq('id', activeEvent.id);
```

Но:
1. **RLS блокирует UPDATE** — политика `Treasure hunt update by admin` разрешает изменения только админам. Обычный игрок получает RLS-фейл, `is_active` в БД остаётся `true`.
2. **`ended_at` (дедлайн) перезаписывается** на `now()` — даже если б UPDATE прошёл, изначальное время окончания терялось бы.
3. **Серверного авто-закрытия нет** — cron-задача отсутствует, поэтому событие живёт «активным» бесконечно после истечения таймера.
4. **Цикл спама**: `useEffect` каждую секунду пересчитывает `endTime - now`, видит «≤0», вызывает `endEvent()`. Запрос летит каждую секунду, тост спамится, RLS отбивает каждый раз. У части игроков выглядит как «таймер сбросился» (особенно после reload, когда `loadActiveEvent` снова цепляет тот же активный event с уже истёкшим `ended_at`).
5. **`loadActiveEvent`** не учитывает `ended_at < now()`: достаёт `is_active=true` без проверки дедлайна → истёкшее событие отображается как активное.

### План фикса

**1. SQL-миграция: серверное авто-завершение + RPC**

- Добавить SECURITY DEFINER RPC `auto_finalize_expired_treasure_hunts()`:
  - Находит все события `is_active=true AND ended_at IS NOT NULL AND ended_at <= now()`.
  - Ставит им `is_active=false`. **`ended_at` НЕ трогаем** — сохраняем оригинальный дедлайн.
  - Возвращает количество закрытых.
- Включить расширения `pg_cron` + `pg_net` (если ещё нет) и поставить cron каждую минуту:
  ```sql
  SELECT cron.schedule('auto-finalize-treasure-hunts', '* * * * *',
    $$SELECT public.auto_finalize_expired_treasure_hunts();$$);
  ```
- Дополнительно: `claim-battle-rewards` и `claim-item-reward` уже корректно проверяют `ended_at <= now()` и отвечают `event_expired` — серверная сторона новых finding'ов не примет.

**2. Клиент `Seekers.tsx`**

- **Удалить клиентский UPDATE** в `endEvent`. Заменить на вызов нового RPC `auto_finalize_expired_treasure_hunts` (он SECURITY DEFINER — пройдёт от любого пользователя, идемпотентен) и затем `loadActiveEvent()` для перезагрузки.
- Сделать `endEvent` идемпотентным: вызывать **только один раз** (флаг `useRef finalizationTriggeredRef`), не спамить тостом.
- В `loadActiveEvent` добавить проверку: если найдено активное, но `ended_at <= now()` → сначала вызвать `auto_finalize_expired_treasure_hunts`, затем повторно загрузить (получим уже закрытое + лидерборд).
- В useEffect таймера: при `remaining <= 0` остановить интервал (`clearInterval` сразу) и один раз триггернуть финализацию.

**3. Memory**

Обновить `mem://admin/treasure-hunt-management`: завершение события исключительно через RPC `auto_finalize_expired_treasure_hunts` (cron + клиентский триггер); прямой UPDATE `treasure_hunt_events` из клиента запрещён; `ended_at` после старта не перезаписывается (это дедлайн, не «время фактического конца»).

### Файлы под изменение

- **Создать миграцию**: RPC `auto_finalize_expired_treasure_hunts` + cron schedule.
- **`src/pages/Seekers.tsx`**: убрать direct UPDATE, добавить RPC-вызов, идемпотентный финализатор, проверка дедлайна в `loadActiveEvent`.
- **`mem://admin/treasure-hunt-management`**: дополнить правилами.

### Что НЕ делаю

Не трогаю RLS, систему наград, админ-RPC создания/тогла событий, edge-функции (они уже правильно проверяют `ended_at`).

### Проверка

- Дождаться истечения `ended_at` (или временно поставить близкий дедлайн через админку): через ≤1 минуты cron сам выставит `is_active=false`. UI игрока: при заходе на /seekers видно «Событие завершено», лидерборд зафиксирован, таймер не возобновляется.
- В сетевой вкладке нет спама `PATCH /treasure_hunt_events`.
- Повторное открытие страницы не «оживляет» событие.

