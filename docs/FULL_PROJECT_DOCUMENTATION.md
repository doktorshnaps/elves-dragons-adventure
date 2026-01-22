# Elleonora RPG - Полная Документация Проекта

> **Версия**: 2.0  
> **Дата обновления**: 22 января 2026  
> **Стек**: React 18 + TypeScript + Vite + Tailwind CSS + Supabase + NEAR Wallet

---

## Содержание

1. [Обзор проекта](#1-обзор-проекта)
2. [Архитектура приложения](#2-архитектура-приложения)
3. [Структура каталогов](#3-структура-каталогов)
4. [База данных](#4-база-данных)
5. [RPC функции](#5-rpc-функции)
6. [Edge Functions](#6-edge-functions)
7. [Игровые механики](#7-игровые-механики)
8. [Аутентификация](#8-аутентификация)
9. [Ключевые файлы](#9-ключевые-файлы)
10. [Типичные сценарии](#10-типичные-сценарии)

---

## 1. Обзор проекта

**Elleonora RPG** - браузерная RPG-игра с NFT интеграцией и блокчейн-токенами. Игроки собирают карточных героев и драконов, проходят подземелья, развивают базу и зарабатывают токены.

### Основные сущности:
- **Герои (Characters)** - персонажи 7 фракций с уникальными способностями
- **Драконы (Pets)** - питомцы с элементальной привязкой
- **Подземелья (Dungeons)** - PvE контент с боссами и наградами
- **База (Shelter)** - здания для производства ресурсов
- **Предметы (Items)** - зелья, материалы, крафтовые компоненты

### Экономика:
- **ELL** - внутриигровая валюта
- **MGT** - блокчейн-токен (NEAR)
- **Ресурсы**: дерево, камень, железо, золото

---

## 2. Архитектура приложения

### 4-уровневая архитектура данных

```
┌─────────────────────────────────────────────────────────────────┐
│                    УРОВЕНЬ 1: Supabase PostgreSQL               │
│          Единственный источник правды для всех данных           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  game_data  │ │card_instances│ │item_instances│ │  51 таблиц ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    УРОВЕНЬ 2: React Query                        │
│              Кеширование + Автоинвалидация                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ GameDataContext  │  │ useCardInstances │  │ useItemInstances││
│  │  staleTime: 30m  │  │  staleTime: 30m  │  │  staleTime: 30m │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       УРОВЕНЬ 3: Zustand                         │
│        UI-состояние (НЕ серверные данные!)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ gameStore: selectedTeam, battleState, accountLevel (UI)    ││
│  │            isLoading, модальные окна, временные флаги      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   УРОВЕНЬ 4: React Компоненты                    │
│              useQuery hooks + Context Providers                  │
└─────────────────────────────────────────────────────────────────┘
```

### Принципы архитектуры:

1. **Единый источник правды** - только Supabase хранит состояние
2. **Кеширование через React Query** - staleTime 30 минут, автоинвалидация
3. **Zustand только для UI** - временное состояние, НЕ серверные данные
4. **Монитор производительности** - отслеживание latency всех запросов

---

## 3. Структура каталогов

```
src/
├── App.tsx                     # Главный компонент с провайдерами
├── main.tsx                    # Entry point
│
├── pages/                      # Страницы маршрутизации
│   ├── Auth.tsx               # Аутентификация NEAR
│   ├── Menu.tsx               # Главное меню
│   ├── Dungeons.tsx           # Выбор подземелий
│   ├── Shelter.tsx            # База (здания)
│   ├── Equipment.tsx          # Экипировка
│   ├── Grimoire.tsx           # Гримуар (все карты)
│   ├── ShopPage.tsx           # Магазин
│   ├── QuestPage.tsx          # Квесты
│   ├── MedicalBay.tsx         # Медпункт
│   ├── Forge.tsx              # Кузница
│   ├── AdminSettings.tsx      # Админ-панель
│   └── dungeons/              # Конкретные подземелья
│       ├── SpiderNest.tsx
│       ├── PantheonOfGods.tsx
│       ├── DragonLair.tsx
│       └── ...
│
├── components/
│   ├── game/                  # Игровые компоненты
│   │   ├── battle/           # Боевая система
│   │   │   ├── BattleUI.tsx
│   │   │   ├── CombatLog.tsx
│   │   │   └── ...
│   │   ├── cards/            # Отображение карт
│   │   │   ├── CardDisplay.tsx
│   │   │   ├── CardStats.tsx
│   │   │   └── ...
│   │   ├── inventory/        # Инвентарь
│   │   ├── shelter/          # Здания базы
│   │   └── team/             # Команда игрока
│   ├── admin/                # Админ-компоненты
│   │   ├── AdminConsole.tsx
│   │   ├── BannedUsersManager.tsx
│   │   └── ...
│   └── ui/                   # shadcn/ui компоненты
│
├── contexts/                  # React Контексты
│   ├── GameDataContext.tsx   # Основные данные игры
│   ├── WalletConnectContext.tsx # NEAR кошелёк
│   ├── AdminContext.tsx      # Права администратора
│   ├── CardInstancesProvider.tsx
│   ├── ItemInstancesProvider.tsx
│   └── ...
│
├── hooks/                     # React хуки
│   ├── useCards.ts           # Получение карт
│   ├── useCardInstances.ts   # БД карты
│   ├── useItemInstances.ts   # БД предметы
│   ├── useGameData.ts        # Данные игры
│   ├── useBalanceState.ts    # Баланс игрока
│   └── battle/               # Хуки для боя
│       ├── useBattleState.ts
│       ├── useBattleRewards.ts
│       └── ...
│
├── stores/                    # Zustand сторы
│   └── gameStore.ts          # UI состояние
│
├── types/                     # TypeScript типы
│   ├── cards.ts
│   ├── battle.ts
│   ├── inventory.ts
│   └── ...
│
├── dungeons/                  # Генераторы подземелий
│   ├── dungeonManager.ts     # Центральный менеджер
│   ├── generators/           # Старые генераторы
│   └── balanced/             # Сбалансированные генераторы
│
├── data/                      # Статические данные
│   ├── cardDatabase.ts       # База карт
│   └── cards/                # Данные карт по фракциям
│
├── services/                  # Сервисы
│   ├── BatchOperationsService.ts
│   └── ...
│
├── utils/                     # Утилиты
│   ├── cardUtils.ts
│   ├── validationSchemas.ts
│   └── ...
│
└── integrations/
    └── supabase/
        ├── client.ts         # Supabase клиент
        ├── monitoredClient.ts # Мониторинг запросов
        ├── types.ts          # Автогенерируемые типы
        └── index.ts          # Реэкспорт
```

---

## 4. База данных

### 4.1 Основные таблицы (Данные игрока)

| Таблица | Описание | Ключевые поля |
|---------|----------|---------------|
| `game_data` | Основные данные игрока | `wallet_address`, `balance`, `wood`, `stone`, `iron`, `gold`, `building_levels`, `selected_team`, `account_level`, `account_experience` |
| `card_instances` | Экземпляры карт игрока | `wallet_address`, `card_template_id`, `card_type`, `card_data`, `current_health`, `current_defense`, `max_health`, `max_defense`, `monster_kills` |
| `item_instances` | Экземпляры предметов | `wallet_address`, `template_id`, `name`, `type` |
| `medical_bay` | Карты на лечении | `card_instance_id`, `heal_rate`, `estimated_completion`, `is_completed` |
| `forge_bay` | Карты на ремонте брони | `card_instance_id`, `repair_rate`, `estimated_completion`, `is_completed` |
| `profiles` | Профили пользователей | `wallet_address`, `display_name`, `user_id` |

### 4.2 Таблицы конфигурации (Статические)

| Таблица | Описание |
|---------|----------|
| `card_templates` | Шаблоны карт (характеристики по редкости) |
| `card_images` | Изображения карт |
| `item_templates` | Шаблоны предметов (зелья, материалы) |
| `building_configs` | Конфигурация зданий (стоимость, производство) |
| `crafting_recipes` | Рецепты крафтинга |
| `dungeon_settings` | Настройки подземелий (HP/ATK/Armor рост) |
| `dungeon_item_drops` | Дроп предметов в подземельях |
| `monsters` | Данные монстров (имена, изображения) |
| `faction_elements` | Стихии фракций (сильные/слабые против) |
| `card_upgrade_requirements` | Требования для улучшения карт |
| `rarity_multipliers` | Множители по редкости |
| `class_multipliers` | Множители по классам героев |
| `dragon_class_multipliers` | Множители по классам драконов |
| `hero_base_stats` | Базовые характеристики героев |
| `dragon_base_stats` | Базовые характеристики драконов |

### 4.3 Таблицы сессий и активности

| Таблица | Описание |
|---------|----------|
| `active_dungeon_sessions` | Активные сессии подземелий |
| `wallet_connections` | История подключений кошельков |
| `wallet_identities` | Верификация кошельков |
| `user_quest_progress` | Прогресс квестов |
| `user_daily_quest_progress` | Ежедневные квесты |
| `reward_claims` | Заявки на награды |
| `claim_nonces` | Одноразовые токены для claim |

### 4.4 Таблицы безопасности и администрирования

| Таблица | Описание |
|---------|----------|
| `banned_users` | Забаненные игроки |
| `user_roles` | Роли пользователей (admin/super_admin) |
| `security_audit_log` | Логи безопасности |
| `api_rate_limits` | Rate limiting |
| `data_changes` | История изменений данных |
| `maintenance_mode` | Режим обслуживания |

### 4.5 Таблицы экономики

| Таблица | Описание |
|---------|----------|
| `mgt_claims` | Заявки на MGT токены |
| `mgt_exchange_requests` | Запросы обмена MGT |
| `soul_donations` | Пожертвования душ |
| `referrals` | Реферальная система |
| `referral_earnings` | Реферальные заработки |
| `shop_inventory` | Инвентарь магазина |
| `shop_sessions` | Сессии покупок |
| `shop_settings` | Настройки магазина |

### 4.6 Таблицы событий

| Таблица | Описание |
|---------|----------|
| `treasure_hunt_events` | События охоты за сокровищами |
| `treasure_hunt_findings` | Находки сокровищ |
| `quests` | Социальные квесты |
| `daily_quest_templates` | Шаблоны ежедневных квестов |

### 4.7 Таблицы NFT

| Таблица | Описание |
|---------|----------|
| `user_nft_cards` | NFT карты пользователей |
| `whitelist_contracts` | Белый список NFT контрактов |

---

## 5. RPC Функции

### 5.1 Категории RPC

**Всего 100+ RPC функций**, разделённых на категории:

### 5.2 Административные функции (`admin_*`)

| Функция | Параметры | Описание |
|---------|-----------|----------|
| `admin_add_balance` | `p_target_wallet_address, p_amount` | Добавить баланс ELL |
| `admin_add_balance_by_id` | `p_target_user_id, p_amount` | Добавить баланс по UUID |
| `admin_ban_user` | `p_target_wallet_address, p_reason` | Забанить игрока |
| `admin_ban_user_by_id` | `p_target_user_id, p_reason` | Забанить по UUID |
| `admin_unban_user` | `p_target_wallet_address` | Разбанить игрока |
| `admin_unban_user_by_id` | `p_target_user_id` | Разбанить по UUID |
| `admin_get_user_info` | `p_user_id` | Информация о игроке |
| `admin_find_user_by_wallet` | `p_wallet_address` | Найти по кошельку |
| `admin_get_player_cards` | `p_target_wallet_address` | Карты игрока |
| `admin_get_player_inventory` | `p_target_wallet_address` | Инвентарь игрока |
| `admin_set_player_balance` | `p_target_wallet_address, p_new_balance` | Установить баланс |
| `admin_give_player_card` | `p_target_wallet_address, p_card_template_id, p_card_data` | Выдать карту |
| `admin_give_player_item` | `p_target_wallet_address, p_template_id` | Выдать предмет |
| `admin_remove_player_card` | `p_card_instance_id` | Удалить карту |
| `admin_remove_player_item` | `p_item_instance_id` | Удалить предмет |

### 5.3 Игровые функции

| Функция | Параметры | Описание |
|---------|-----------|----------|
| `ensure_game_data_exists` | `p_wallet_address` | Создать данные нового игрока |
| `get_game_data_by_wallet` | `p_wallet_address` | Получить данные игры |
| `update_game_data_by_wallet_v2` | `p_wallet_address, p_updates` | Обновить данные (JSONB) |
| `apply_battle_rewards` | `...` | Применить награды боя |
| `get_maintenance_status` | - | Статус обслуживания |
| `set_maintenance_mode` | `p_is_enabled, p_message` | Режим обслуживания |

### 5.4 Функции карт

| Функция | Параметры | Описание |
|---------|-----------|----------|
| `get_card_instances_by_wallet` | `p_wallet_address` | Получить карты |
| `create_card_instance_by_wallet` | `p_wallet_address, p_card` | Создать карту |
| `update_card_instance_health` | `p_instance_id, p_wallet_address, p_current_health` | Обновить HP |
| `update_card_instance_defense` | `p_instance_id, p_wallet_address, p_current_defense` | Обновить броню |
| `increment_card_monster_kills` | `p_card_template_id, p_wallet_address, p_kills_to_add` | Добавить убийства |
| `batch_update_card_stats` | `p_wallet_address, p_card_updates` | Batch обновление |

### 5.5 Функции предметов

| Функция | Параметры | Описание |
|---------|-----------|----------|
| `get_item_instances_by_wallet` | `p_wallet_address` | Получить предметы |
| `add_item_instances` | `p_wallet_address, p_items` | Добавить предметы |
| `remove_item_instances` | `p_wallet_address, p_instance_ids` | Удалить предметы |
| `craft_multiple_items` | `p_wallet_address, p_recipes` | Крафтинг |

### 5.6 Функции медпункта и кузницы

| Функция | Параметры | Описание |
|---------|-----------|----------|
| `add_card_to_medical_bay` | `p_wallet_address, p_card_instance_id, p_healing_hours` | На лечение |
| `add_card_to_forge_bay` | `p_wallet_address, p_card_instance_id, p_repair_hours` | На ремонт |

### 5.7 Функции подземелий

| Функция | Параметры | Описание |
|---------|-----------|----------|
| `get_dungeon_item_drops` | `p_dungeon_number, p_dungeon_level` | Дроп предметов |

---

## 6. Edge Functions

### 6.1 Список Edge Functions (28 функций)

| Функция | Описание | JWT |
|---------|----------|-----|
| `start-dungeon-session` | Начало сессии подземелья | false |
| `end-dungeon-session` | Завершение сессии | false |
| `claim-battle-rewards` | Получение наград боя | false |
| `get-claim-challenge` | Генерация challenge | false |
| `shop-purchase` | Покупка в магазине | false |
| `create-shop-session` | Создание сессии покупки | false |
| `open-card-packs` | Открытие паков карт | true |
| `open-elleonor-box` | Открытие боксов | - |
| `sync-nft-cards` | Синхронизация NFT | true |
| `sync-mintbase-nfts` | Mintbase NFT | true |
| `game-wipe` | Сброс данных игрока | true |
| `admin-recalculate-card-stats` | Пересчёт статов | false |
| `validate-wallet` | Валидация кошелька | false |
| `process-referral` | Обработка реферала | false |
| `claim-referral-reward` | Награда реферала | false |
| `get-leaderboard` | Таблица лидеров | false |
| `daily-quest-progress` | Прогресс ежедневных | false |
| `claim-daily-quest` | Награда ежедневного | false |

### 6.2 Структура Edge Function

```typescript
// supabase/functions/start-dungeon-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { walletAddress, dungeonType, level } = await req.json()

    // Логика функции...

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 7. Игровые механики

### 7.1 Система карт

#### Типы карт:
- **character** - Герои (люди, эльфы, орки...)
- **pet** - Драконы (питомцы)
- **worker** - Рабочие (для зданий)

#### Редкость (1-9):
| Уровень | Название | Множитель |
|---------|----------|-----------|
| 1 | Обычный (Common) | 1.0 |
| 2 | Необычный (Uncommon) | 1.2 |
| 3 | Редкий (Rare) | 1.5 |
| 4 | Эпический (Epic) | 2.0 |
| 5 | Легендарный (Legendary) | 2.5 |
| 6 | Мифический (Mythic) | 3.0 |
| 7 | Божественный (Divine) | 4.0 |
| 8 | Бессмертный (Immortal) | 5.0 |
| 9 | Титан (Titan) | 6.0 |

#### Фракции и стихии (7 фракций):

| Фракция | Стихия | Сильна против | Слаба против |
|---------|--------|---------------|--------------|
| Калейдор | Лёд | Огонь | Вода |
| Аэлантир | Огонь | Земля | Лёд |
| Лиорас | Земля | Молния | Огонь |
| Фаэлин | Вода | Лёд | Земля |
| Элленар | Свет | Тьма | Молния |
| Телерион | Тьма | Молния | Свет |
| Сильванести | Песок | Вода | Тьма |

**Модификаторы урона:**
- Сильна против: +20% урона
- Слаба против: -20% урона

#### Характеристики:
- **Power** - Сила атаки
- **Defense** - Броня (поглощает урон)
- **Health** - Здоровье
- **Magic** - Магия (для способностей)

### 7.2 Боевая система

#### D6 система:
```
Игрок бросает кубик (1-6):
1 - Критический промах, монстр контратакует
2 - Промах
3 - Слабый удар (50% урона)
4 - Нормальный удар (100% урона)
5 - Сильный удар (150% урона)
6 - Критический удар (200% урона)
```

#### Формула урона:
```
Урон = Power × DiceModifier × ElementalModifier
Поглощённый урон = min(Defense, входящий_урон)
Финальный урон = входящий_урон - Поглощённый урон
```

#### Команда игрока:
- 2 героя + 2 дракона
- Общий HP команды
- Общая атака = сумма Power всех членов

### 7.3 Подземелья

#### Типы подземелий:
1. **Паучье гнездо** (Spider Nest) - Земля
2. **Пантеон богов** (Pantheon) - Свет
3. **Логово дракона** (Dragon Lair) - Огонь
4. **Ледяная пещера** (Ice Cave) - Лёд
5. **Тёмные глубины** (Dark Depths) - Тьма
6. **Водопад** (Waterfall) - Вода
7. **Песчаный шторм** (Sand Storm) - Песок

#### Прогрессия уровней:
- Уровни 1-49: Обычные монстры
- Уровень 50: Мини-босс (x2 характеристики)
- Уровни 51-99: Усиленные монстры
- Уровень 100: Финальный босс (x3 характеристики)

#### Формула характеристик монстров:
```
HP = base_hp + (level × hp_growth)
Attack = base_atk + (level × atk_growth)
Armor = base_armor + (level × armor_growth)
```

### 7.4 Система зданий

| Здание | Функция | Производство |
|--------|---------|--------------|
| Main Hall | Главное здание | Открывает другие здания |
| Sawmill | Лесопилка | Дерево/час |
| Quarry | Каменоломня | Камень/час |
| Iron Mine | Железная шахта | Железо/час |
| Storage | Склад | Увеличение лимитов |
| Barracks | Казармы | Улучшение героев |
| Dragon Lair | Логово дракона | Улучшение драконов |
| Medical Bay | Медпункт | Лечение карт |
| Forge | Кузница | Ремонт брони |
| Workshop | Мастерская | Крафтинг предметов |

### 7.5 Медпункт и Кузница

**Механика:**
1. Игрок ставит карту на лечение/ремонт
2. Карта блокируется, таймер запускается
3. HP/Броня восстанавливается по формуле: `heal_rate` единиц/час
4. По завершении игрок нажимает "Забрать"
5. RPC обновляет `current_health`/`current_defense` в БД

**Важно:** Требуется RPC для claim (применения восстановления).

---

## 8. Аутентификация

### 8.1 NEAR Wallet (НЕ Supabase Auth!)

Проект использует **NEAR Blockchain** для аутентификации:

```typescript
// Подключение через @near-wallet-selector
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupHotWallet } from '@near-wallet-selector/hot-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
// ...
```

### 8.2 Поддерживаемые кошельки:
- HOT Wallet
- My NEAR Wallet
- Here Wallet
- Meteor Wallet
- Nightly

### 8.3 Флоу аутентификации:
1. Пользователь нажимает "Подключить кошелёк"
2. Выбирает провайдер (HOT, MyNearWallet...)
3. Подписывает сообщение кошельком
4. `wallet_address` сохраняется в `wallet_identities`
5. Создаётся `game_data` для нового игрока

### 8.4 Проверка прав администратора:
```sql
-- Функция check_is_current_user_admin()
SELECT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE wallet_address = current_wallet 
  AND role IN ('admin', 'super_admin')
);
```

---

## 9. Ключевые файлы

### 9.1 Для понимания архитектуры:

| Файл | Описание |
|------|----------|
| `src/App.tsx` | Иерархия провайдеров |
| `src/contexts/GameDataContext.tsx` | Основной источник данных |
| `src/contexts/WalletConnectContext.tsx` | NEAR кошелёк |
| `src/stores/gameStore.ts` | Zustand UI-стор |
| `src/integrations/supabase/monitoredClient.ts` | Мониторинг запросов |

### 9.2 Для понимания игровой логики:

| Файл | Описание |
|------|----------|
| `src/hooks/useCards.ts` | Получение карт игрока |
| `src/hooks/useCardInstances.ts` | Работа с card_instances |
| `src/hooks/battle/useBattleState.ts` | Состояние боя |
| `src/hooks/battle/useBattleRewards.ts` | Награды боя |
| `src/dungeons/dungeonManager.ts` | Генерация монстров |
| `src/utils/cardUtils.ts` | Расчёт статов карт |

### 9.3 Для понимания БД:

| Файл | Описание |
|------|----------|
| `src/integrations/supabase/types.ts` | Автогенерируемые типы |
| `supabase/migrations/*.sql` | Миграции БД |

---

## 10. Типичные сценарии

### 10.1 Добавление нового подземелья

1. Создать генератор в `src/dungeons/balanced/`
2. Добавить настройки в `dungeon_settings`
3. Добавить дроп в `dungeon_item_drops`
4. Создать страницу в `src/pages/dungeons/`
5. Добавить маршрут в `App.tsx`

### 10.2 Добавление новой карты

1. Добавить данные в соответствующий файл `src/data/cards/`
2. Добавить шаблон в `card_templates`
3. Добавить изображение в `card_images`
4. Добавить маппинг класса в `card_class_mappings`

### 10.3 Добавление нового предмета

1. Добавить шаблон в `item_templates`
2. Настроить дроп в `dungeon_item_drops` (если нужно)
3. Добавить рецепт в `crafting_recipes` (если крафтовый)

### 10.4 Изменение баланса

1. Найти таблицу конфигурации (`dungeon_settings`, `rarity_multipliers`...)
2. Обновить значения через админ-панель или миграцию
3. Пересчитать существующие карты через `admin-recalculate-card-stats`

---

## Контакты

**Разработчик**: [Ваше имя]  
**Email**: [email]  
**Telegram**: [telegram]

---

*Документация создана 22 января 2026*
