

## Карты пропадают после воскрешения — диагностика и фикс

### Что нужно понять
Игрок воскрешает карту (revive в медпункте/морге), после чего карта исчезает совсем — её нет ни в команде, ни в списке карт, ни в медпункте.

### Гипотезы

**1. revive RPC случайно удаляет card_instance вместо обновления currentHealth.**
Если в `revive_card` или `revive_dead_card` вместо `UPDATE card_instances SET current_health = max_health WHERE id = ...` стоит `DELETE FROM card_instances`, карта пропадёт безвозвратно.

**2. Триггер sync_card_medical_bay_flag сносит карту.**
По memory `medical-bay-orphan-cards-fix` есть триггер, который при несоответствии флага `is_in_medical_bay` и записи в `medical_bay` чинит состояние. Если revive удаляет запись из `medical_bay`, но не сбрасывает флаг — триггер может оставить карту в неконсистентном состоянии (orphan), и UI её отфильтрует.

**3. Frontend оптимистично удаляет карту из state и не возвращает.**
В `useMedicalBay.reviveCard` или аналоге может быть `setCards(prev => prev.filter(c => c.id !== cardId))` без последующего refetch — карта пропадает из UI, в БД остаётся живой, но не видна.

**4. card_instance_id vs card_template_id путаница.**
По memory `batch-card-updates-card-instance-id-pattern` все апдейты должны идти через `card_instance_id`. Если revive ищет по `card_template_id`, может удалить/обновить не ту карту (или ничего не сделать, оставив игрока в подвисшем состоянии).

**5. Карта удаляется из `player_teams` при отправке в морг и не возвращается после revive — но это ожидаемо. Проверить, что после revive карта появляется в общем пуле и доступна для добавления в команду.**

**6. `is_dead` или `current_health = 0` остаётся после revive.**
Если revive обновил `current_health`, но не сбросил `is_dead`/флаг "в морге" — UI фильтрует мёртвых из всех списков.

### План расследования (read-only)

1. Прочитать revive-функции:
   - Поиск `revive` в `supabase/functions/` и `src/hooks/`.
   - Прочитать SQL функцию `revive_card` / `revive_dead_card` через `supabase--read_query`: `SELECT prosrc FROM pg_proc WHERE proname ILIKE '%revive%'`.
   - Прочитать триггеры на `card_instances` и `medical_bay`.

2. Прочитать клиентскую логику:
   - `src/hooks/useMedicalBay.ts` (revive handler).
   - `src/hooks/useCardInstances.ts` (фильтры мёртвых карт).
   - Любые компоненты "Морг"/"Кладбище"/"Воскресить".

3. Проверить данные в БД:
   - `SELECT id, name, current_health, max_health, is_in_medical_bay, is_dead FROM card_instances WHERE wallet_address = '...' AND (current_health = 0 OR is_dead = true)` — посмотреть, есть ли orphan-карты.
   - Проверить `medical_bay` на orphan-записи без соответствующих `card_instances`.

4. Проверить логи Edge Functions (если revive — Edge Function), особенно поиск ошибок и DELETE-операций.

### План фикса (точные изменения формулируются после диагностики)

Скорее всего понадобится один из вариантов:

**Вариант A — фикс RPC**: revive должен делать только `UPDATE card_instances SET current_health = max_health, current_defense = max_defense, is_in_medical_bay = false` + `DELETE FROM medical_bay WHERE card_instance_id = ...`. Никаких `DELETE FROM card_instances`.

**Вариант B — фикс клиента**: после revive вызвать `queryClient.invalidateQueries(['cardInstances'])` + НЕ удалять карту локально. Карта вернётся в общий пул через refetch.

**Вариант C — фикс orphan-state**: если карта в неконсистентном состоянии (флаг есть, записи нет), запустить one-time SQL чистку + триггер уже есть по memory.

**Вариант D — восстановление потерянных карт игрока**: если данные ушли в DELETE, попытаться восстановить из бэкапа/логов (если возможно). Если нет — компенсация админ-RPC (выдать карты заново).

### Что сделаю в default mode после одобрения
1. Прочитаю revive-логику (RPC + клиент + триггеры).
2. Запрошу данные игрока в БД, найду пропавшие карты.
3. Если карта в orphan-state — починю флаги, она вернётся в UI.
4. Если RPC удаляет — перепишу на UPDATE.
5. Если клиент удаляет — добавлю invalidateQueries вместо local filter.
6. Добавлю memory-rule о правильном поведении revive.
7. По возможности восстановлю карты пострадавшего игрока (нужен его wallet — спрошу при необходимости).

### Что НЕ делаю
Не трогаю combat/dungeon/PvP, не меняю общую архитектуру card_instances, не лезу в RLS.

