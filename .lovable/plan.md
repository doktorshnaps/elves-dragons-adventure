

## Проблемы

1. **Двойное создание**: RPC вызывается дважды (double-click или React StrictMode). Нет защиты от повторного нажатия.
2. **Старт не работает**: `toggleEventStatus` использует прямой `.update()` на `treasure_hunt_events`, который блокируется RLS. Тост показывает "Событие запущено", но в БД ничего не меняется — `is_active` остаётся `false`.
3. **Удаление не работает**: `.delete()` тоже блокируется RLS. Кнопка удаления к тому же disabled при `is_active === true`, но даже для неактивных — удаление не проходит.
4. **"Событие завершено" сразу**: При создании `ended_at` устанавливается на 7 дней вперёд, но `is_active = false` и `started_at = null`. Страница Seekers видит `is_active: false` и показывает "Событие завершено".

## Решение

### 1. Два новых SECURITY DEFINER RPC (миграция)

- **`admin_toggle_treasure_hunt_event(p_admin_wallet, p_event_id, p_activate)`**: проверяет админ-права, при активации деактивирует другие события, ставит `is_active = true` + `started_at`, при деактивации ставит `is_active = false` + `ended_at = now()`.
- **`admin_delete_treasure_hunt_event(p_admin_wallet, p_event_id)`**: проверяет админ-права, удаляет связанные предметы через `delete_treasure_hunt_items`, затем удаляет само событие.

### 2. Исправить создание события

- В RPC `admin_create_treasure_hunt_event`: создавать событие с `is_active = false`, `started_at = null`, `ended_at` = рассчитанная дата. Событие не активно до нажатия "Старт".
- На фронте: добавить `disabled` на кнопку создания пока идёт запрос (уже есть через `loading`, но нужно убедиться что `setLoading(true)` срабатывает до await).

### 3. Обновить фронтенд `TreasureHuntAdmin.tsx`

- `toggleEventStatus` → вызывает `admin_toggle_treasure_hunt_event` RPC
- `deleteEvent` → вызывает `admin_delete_treasure_hunt_event` RPC
- Убрать `disabled={event.is_active}` с кнопки удаления (или оставить как защиту, но не как блокер)
- Разрешить удаление неактивных событий

### 4. Исправить отображение на странице Seekers

- Страница `Seekers.tsx`: показывать "Событие завершено" только когда `is_active === false` И `started_at !== null` (т.е. событие было запущено и завершено). Если `started_at === null` — это ещё не запущенное событие, показывать "Ожидает запуска" или не показывать вообще.
- Загружать только активные события для обычных игроков, или последнее завершённое если активного нет.

### Файлы

- `supabase/migrations/...` — два новых RPC
- `src/components/admin/TreasureHuntAdmin.tsx` — переход на RPC для toggle/delete
- `src/pages/Seekers.tsx` — корректная логика отображения статуса

