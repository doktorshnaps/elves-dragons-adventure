
# Система Кланов -- Этап 1: Фундамент

## Обзор

Игрок строит здание "Клановый Зал" в Убежище. После постройки на странице `/menu` появляется новая кнопка "Клан", ведущая на страницу `/clan` со всей функциональностью кланов (создание, вступление, управление участниками, лидерборд).

## Что будет реализовано

**Здание "Клановый Зал" в Убежище:**
- Новый тип здания `clan_hall` в системе зданий (building_configs, buildingLevels)
- Отображается в сетке зданий Убежища наравне с казармами, кузницей и т.д.
- Требует постройки (уровень 1) для доступа к функционалу кланов
- Уровни 1-8 с возможностью развития (бонусы на будущие этапы)

**Страница Клана (`/clan`):**
- Создание клана (название, описание, политика вступления)
- Просмотр информации о своём клане (участники, роли, уровень)
- Система ролей: Глава, Заместитель (макс 2), Офицер, Участник
- Заявки на вступление (подача / одобрение / отклонение)
- Выход из клана / исключение участников
- Передача лидерства
- Глобальный лидерборд кланов (по суммарному Elo участников)

**Кнопка в меню:**
- Появляется только если `buildingLevels.clan_hall >= 1`
- Стиль аналогичен остальным кнопкам меню

---

## Технические детали

### 1. База данных -- Новые таблицы

```text
clans
  id            uuid PK default gen_random_uuid()
  name          text UNIQUE NOT NULL (3-20 символов)
  description   text (макс 200 символов)
  emblem        text default 'shield' -- ключ иконки
  leader_wallet text NOT NULL
  level         int default 1
  experience    int default 0
  treasury_ell  int default 0
  max_members   int default 20
  join_policy   text default 'approval' -- 'open' | 'approval' | 'invite_only'
  created_at    timestamptz default now()

clan_members
  id             uuid PK default gen_random_uuid()
  clan_id        uuid FK -> clans ON DELETE CASCADE
  wallet_address text NOT NULL
  role           text NOT NULL default 'member' -- 'leader' | 'deputy' | 'officer' | 'member'
  joined_at      timestamptz default now()
  contributed_ell int default 0
  UNIQUE(clan_id, wallet_address)

clan_join_requests
  id             uuid PK default gen_random_uuid()
  clan_id        uuid FK -> clans ON DELETE CASCADE
  wallet_address text NOT NULL
  status         text default 'pending' -- 'pending' | 'accepted' | 'rejected'
  message        text -- опциональное сообщение от заявителя
  created_at     timestamptz default now()
  reviewed_by    text -- кошелёк того, кто рассмотрел
  reviewed_at    timestamptz
```

**RLS-политики:**
- `clans`: SELECT для всех аутентифицированных (лидерборд), INSERT/UPDATE/DELETE через RPC
- `clan_members`: SELECT для всех аутентифицированных, INSERT/UPDATE/DELETE через RPC
- `clan_join_requests`: SELECT для участников клана + своих заявок, INSERT/UPDATE/DELETE через RPC

### 2. RPC-функции (SECURITY DEFINER)

- `create_clan(p_wallet, p_name, p_description, p_join_policy)` -- создание клана, автор становится лидером
- `join_clan(p_wallet, p_clan_id, p_message)` -- заявка на вступление (или авто-вступление для open)
- `review_join_request(p_wallet, p_request_id, p_accept)` -- одобрение/отклонение заявки (только leader/deputy/officer)
- `leave_clan(p_wallet)` -- выход из клана (лидер не может выйти, пока не передаст лидерство)
- `kick_member(p_wallet, p_target_wallet)` -- исключение (leader/deputy могут кикнуть officer/member)
- `change_member_role(p_wallet, p_target_wallet, p_new_role)` -- смена роли
- `transfer_leadership(p_wallet, p_target_wallet)` -- передача лидерства
- `get_clan_leaderboard()` -- топ кланов по суммарному Elo участников
- `get_my_clan(p_wallet)` -- информация о клане игрока с участниками
- `disband_clan(p_wallet)` -- расформировать клан (только лидер)

### 3. Здание "Клановый Зал" -- Интеграция

**Файлы, которые будут изменены:**

- `src/utils/jsonbValidation.ts` -- добавить `clan_hall: z.number().default(0)` в BuildingLevelsSchema
- `src/contexts/GameDataContext.tsx` -- добавить `clan_hall: 0` в DEFAULT_GAME_DATA.buildingLevels
- `src/hooks/shelter/useShelterState.ts` -- добавить `clan_hall` в buildingLevels memo и в nestUpgrades массив
- `src/components/admin/ShelterBuildingSettings.tsx` -- добавить `{ id: 'clan_hall', name: 'Клановый зал' }` в BUILDING_TYPES
- `building_configs` таблица -- добавить конфигурацию уровня 1 для `clan_hall` (стоимость постройки)

### 4. Новые файлы

```text
src/pages/Clan.tsx                          -- Главная страница клана
src/components/game/clan/ClanOverview.tsx    -- Обзор своего клана (участники, роли)
src/components/game/clan/ClanCreate.tsx      -- Форма создания клана
src/components/game/clan/ClanSearch.tsx      -- Поиск и список кланов для вступления
src/components/game/clan/ClanLeaderboard.tsx -- Рейтинг кланов
src/components/game/clan/ClanRequests.tsx    -- Управление заявками (для officer+)
src/components/game/clan/ClanMembers.tsx     -- Список участников с действиями
src/hooks/useClan.ts                        -- Хук для работы с кланами (RPC вызовы)
```

### 5. Маршрутизация и меню

- `src/App.tsx` -- добавить маршрут `/clan` с lazy loading и ProtectedRoute
- `src/components/lazy/LazyComponents.tsx` -- добавить LazyClan компонент
- `src/pages/Menu.tsx` -- добавить кнопку "Клан" (условно по `buildingLevels.clan_hall >= 1`)

### 6. Страница Убежища

- `src/pages/Shelter.tsx` -- не требует новой вкладки; здание `clan_hall` появится в сетке зданий на вкладке "Улучшения" автоматически, т.к. оно будет добавлено в `nestUpgrades`

---

## Порядок реализации

1. Миграция БД: таблицы `clans`, `clan_members`, `clan_join_requests` + RLS + RPC
2. Конфигурация здания: `clan_hall` в `building_configs`, обновление schema/defaults
3. Интеграция здания в Убежище (jsonbValidation, useShelterState, GameDataContext, ShelterBuildingSettings)
4. Хук `useClan.ts` для работы с RPC
5. Компоненты страницы клана (ClanCreate, ClanOverview, ClanMembers, ClanRequests, ClanSearch, ClanLeaderboard)
6. Страница `Clan.tsx` с табами
7. Lazy loading, маршрутизация, кнопка в меню
