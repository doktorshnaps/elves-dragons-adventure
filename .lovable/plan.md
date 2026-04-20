

## «Искатели»: настройка длительности игнорируется, всегда 24 часа

### Корень проблемы

В `src/components/admin/TreasureHuntAdmin.tsx` форма содержит три поля длительности:
- `duration_days`
- `duration_hours`
- `duration_minutes`

Но при создании события в RPC `admin_create_treasure_hunt_event` передаётся **только** `p_duration_days`:

```ts
p_duration_days: formData.duration_days,
```

Часы и минуты из формы **никуда не уходят**. Если админ ставит, например, «0 дней, 2 часа, 30 минут», в RPC улетает `p_duration_days: 0`, а серверная функция, скорее всего, при `0` подставляет дефолт = 1 день (24 часа). Отсюда «всегда 24 часа».

Нужно проверить точную сигнатуру RPC `admin_create_treasure_hunt_event` (есть ли там параметры hours/minutes или только days), и при необходимости расширить её.

### План фикса

**1. Проверка/обновление RPC `admin_create_treasure_hunt_event`** (миграция SQL)

- Прочитать текущую сигнатуру через `supabase--read_query` (`pg_get_function_arguments`).
- Дропнуть старую версию (memory `database-rpc-standardization` — не плодить overload).
- Создать новую версию с параметрами:
  - `p_duration_days int default 0`
  - `p_duration_hours int default 0`
  - `p_duration_minutes int default 0`
- Внутри: `v_duration interval := make_interval(days => p_duration_days, hours => p_duration_hours, mins => p_duration_minutes);`
- Если итог `<= interval '0'` → вернуть ошибку `"duration_required"` (не молча подставлять 24ч).
- `ended_at := now() + v_duration` устанавливать **сразу при создании**, чтобы cron-финализатор корректно работал.
- `started_at := now()` тоже при создании (или при тогле — нужно проверить, что `admin_toggle_treasure_hunt_event` делает; если он сейчас выставляет `started_at`/`ended_at` при активации — лучше пересчитывать `ended_at = now() + duration` именно в момент `Старт`, чтобы таймер шёл от запуска, а не от создания).

**Решение**: хранить длительность в БД (новая колонка `duration_seconds int` в `treasure_hunt_events`) и:
- При создании — сохранить `duration_seconds`, `ended_at = NULL`.
- При тогле «Старт» — `started_at = now()`, `ended_at = now() + (duration_seconds || ' seconds')::interval`.
- При тогле «Стоп» — оставить как есть (или сбросить).

Это естественно: таймер начинает идти с момента нажатия «Старт», а не с создания.

**2. Клиент `TreasureHuntAdmin.tsx`**

- Передавать в RPC все три параметра: `p_duration_days`, `p_duration_hours`, `p_duration_minutes`.
- Перед отправкой валидировать: сумма > 0, иначе toast «Укажите длительность».
- (Опционально) показывать в карточках событий рассчитанную длительность/оставшееся время.

**3. Memory**

Обновить `mem://admin/treasure-hunt-management`: длительность задаётся в днях/часах/минутах; хранится в `duration_seconds`; `ended_at` рассчитывается в момент активации (Старт), а не создания; cron `auto_finalize_expired_treasure_hunts` гасит просроченные.

### Файлы под изменение

- **Новая миграция SQL**:
  - `ALTER TABLE treasure_hunt_events ADD COLUMN IF NOT EXISTS duration_seconds integer;`
  - `DROP FUNCTION` старой `admin_create_treasure_hunt_event`, создать новую с 3 параметрами длительности.
  - При необходимости обновить `admin_toggle_treasure_hunt_event`, чтобы при активации пересчитывал `ended_at`.
- **`src/components/admin/TreasureHuntAdmin.tsx`**: добавить hours/minutes в `rpc(...)`, валидация суммы > 0.

### Что НЕ делаю

Не трогаю клиент `Seekers.tsx` (он уже корректно работает с `ended_at` после прошлого фикса), RLS, edge-функции наград.

### Проверка

- Создать событие «0 дн, 0 ч, 5 мин» → нажать «Старт» → таймер на /seekers стартует с 5:00 и через 5 минут событие закрывается (cron + клиентский триггер).
- Создать «0/0/0» → toast «Укажите длительность», запрос не уходит.
- Создать «1 день, 2 часа» → таймер 26:00:00 от момента «Старт».

