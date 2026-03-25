

# Админ-панель для управления заданиями на обмен предметов

## Что нужно сделать

Добавить в админ-панель новую вкладку для управления системой ежедневных заданий на обмен предметов: создание/редактирование шаблонов заданий, настройка количества заданий в день, и глобальные настройки системы.

## База данных

### 1. Таблица `item_exchange_templates`
Хранит все шаблоны заданий на обмен:
- `id` UUID PK
- `title_ru`, `title_en` — названия
- `description_ru`, `description_en` — описания
- `icon` — эмодзи иконка
- `required_items` JSONB — `[{template_id: 5, quantity: 3}]`
- `reward_items` JSONB — `[{template_id: 12, quantity: 1}]`
- `reward_ell` INTEGER DEFAULT 0
- `weight` INTEGER DEFAULT 5 — вес для рандома
- `min_level` INTEGER DEFAULT 1
- `is_active` BOOLEAN DEFAULT true
- `created_at`, `updated_at`

RLS: SELECT для всех active, INSERT/UPDATE/DELETE только для админов.

### 2. Таблица `item_exchange_settings`
Глобальные настройки системы:
- `id` UUID PK
- `min_quests_per_day` INTEGER DEFAULT 3
- `max_quests_per_day` INTEGER DEFAULT 5
- `updated_at`, `updated_by_wallet`

RLS: SELECT для всех, UPDATE только для админов.

### 3. Таблица `user_item_exchanges`
Назначенные игроку задания:
- `id` UUID PK
- `wallet_address` TEXT
- `template_id` UUID FK
- `is_completed` BOOLEAN DEFAULT false
- `is_claimed` BOOLEAN DEFAULT false
- `assigned_date` DATE
- UNIQUE(wallet_address, template_id, assigned_date)

### 4. RPC функции
- `get_user_item_exchanges(p_wallet_address)` — возвращает задания на сегодня, создаёт если нет
- `submit_item_exchange(p_wallet_address, p_exchange_id)` — атомарный обмен предметов

## Фронтенд

### 1. Новый компонент `ItemExchangeAdmin.tsx`
По образцу существующего `QuestManagement.tsx` / `ItemTemplateManager.tsx`:

**Секция настроек:**
- Поля min/max количества заданий в день (числовые инпуты)
- Кнопка "Сохранить настройки"

**Список шаблонов:**
- Таблица всех шаблонов с колонками: иконка, название, требуемые предметы, награды, вес, мин. уровень, статус
- Кнопки "Редактировать" и "Удалить" для каждого

**Форма создания/редактирования:**
- Поля: title_ru, title_en, description_ru, description_en, icon
- Динамический список требуемых предметов (выбор из item_templates + количество)
- Динамический список наград (выбор из item_templates + количество)
- Доп. награда ELL
- Вес (1-10), мин. уровень, is_active

### 2. Интеграция в AdminSettings.tsx
- Новая вкладка "Обмен" в TabsList (для superAdmin)
- `<TabsContent value="exchanges">` с компонентом `<ItemExchangeAdmin />`

## Порядок реализации
1. Миграция: 3 таблицы + RLS + настройки по умолчанию
2. Миграция: 2 RPC функции (get + submit)
3. Компонент `ItemExchangeAdmin.tsx`
4. Компонент `ItemExchangeQuests.tsx` (для игроков)
5. Интеграция в AdminSettings + QuestPage

