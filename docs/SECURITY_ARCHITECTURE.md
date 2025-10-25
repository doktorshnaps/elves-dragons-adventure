# Архитектура безопасности игры

## Обзор проблемы

Критические игровые данные (баланс, карты, инвентарь) хранятся в `localStorage` браузера и могут быть изменены пользователем через DevTools. Это создает риск нечестной игры.

## Текущая защита

### ✅ Что уже работает хорошо

1. **Серверная валидация всех операций**
   - Все изменения баланса проходят через `atomic_balance_update` RPC
   - Все изменения инвентаря через `atomic_inventory_update` RPC
   - SECURITY DEFINER функции имеют встроенные проверки

2. **Zustand Store как источник истины**
   - Все компоненты должны читать данные из `useGameStore()`
   - Автоматическая синхронизация с Supabase через `useGameSync`

3. **Rollback при ошибках**
   - `useGameData.updateGameData()` откатывает изменения при ошибке сервера

## Новые механизмы защиты

### 1. Цифровые подписи для критических данных

Файл: `src/utils/secureStorage.ts`

```typescript
// Использование
import { secureSetItem, secureGetItem } from '@/utils/secureStorage';

// Сохранение с подписью
await secureSetItem('gameBalance', balance, walletAddress);

// Чтение с проверкой подписи
const balance = await secureGetItem<number>('gameBalance', walletAddress);
// Вернет null если подпись невалидна
```

**Защищенные ключи:**
- `gameBalance` - баланс игрока
- `gameCards` - коллекция карт
- `gameInventory` - инвентарь
- `dragonEggs` - драконьи яйца
- `selectedTeam` - выбранная команда

### 2. Автоматическая проверка целостности

Файл: `src/hooks/useSecureStorage.ts`

- Проверяет данные при подключении кошелька
- Периодическая проверка каждые 5 минут
- Автоматически очищает поврежденные данные
- Перезагружает данные с сервера

### 3. Принципы безопасной работы

#### ❌ Неправильно (уязвимо)
```typescript
// Прямое чтение/запись в localStorage
const balance = localStorage.getItem('gameBalance');
localStorage.setItem('gameBalance', '999999'); // Легко подделать!
```

#### ✅ Правильно (защищено)
```typescript
// 1. Читаем из Zustand store
const balance = useGameStore(state => state.balance);

// 2. Изменяем через store
const { setBalance } = useGameStore();
setBalance(newBalance);

// 3. useGameSync автоматически синхронизирует с сервером
// 4. Сервер валидирует все операции
```

## Уровни защиты

### Уровень 1: Клиентская проверка целостности
- Цифровые подписи в localStorage
- Автоматическая очистка поврежденных данных
- **Цель:** Предотвратить случайную порчу данных, затруднить читерство

### Уровень 2: Серверная валидация (главная защита)
- Все критические операции проверяются на сервере
- SECURITY DEFINER функции с проверкой прав
- Атомарные транзакции для целостности данных
- **Цель:** Полная защита от любого читерства

### Уровень 3: Мониторинг и обнаружение
- Логирование подозрительных операций
- Обнаружение аномальных изменений баланса
- Возможность отката данных администратором
- **Цель:** Обнаружение и реагирование на попытки взлома

## Серверная валидация: как это работает

### Пример: Покупка в магазине

```typescript
// 1. Пользователь нажимает "Купить" в UI
const handlePurchase = async (itemId: string) => {
  // 2. Вызываем Edge Function
  const { data, error } = await supabase.functions.invoke('shop-purchase', {
    body: { 
      item_id: itemId,
      quantity: 1 
    }
  });
  
  // Если пользователь изменил localStorage для показа большего баланса,
  // это не поможет - сервер проверит реальный баланс в БД!
};
```

```sql
-- shop-purchase Edge Function вызывает:
SELECT atomic_balance_update(
  p_wallet_address := 'user.near',
  p_price_deduction := 100  -- Цена предмета
);

-- Эта функция:
-- 1. Читает РЕАЛЬНЫЙ баланс из game_data
-- 2. Проверяет, достаточно ли денег
-- 3. Если да - списывает деньги
-- 4. Если нет - возвращает ошибку
-- localStorage пользователя НЕ участвует в проверке!
```

### Критические RPC функции с валидацией

1. **atomic_balance_update** - Изменение баланса
   - Проверяет достаточность средств
   - Атомарная операция UPDATE
   - Возвращает ошибку если недостаточно денег

2. **atomic_inventory_update** - Изменение инвентаря
   - Валидация добавляемых предметов
   - Проверка типов и редкости
   - Защита от дубликатов

3. **admin_insert_item_template** - Добавление предметов (только админ)
   - Проверка прав super_admin
   - Валидация шаблона предмета

4. **process_dungeon_completion** - Награды за подземелье
   - Проверка легитимности победы
   - Валидация количества убитых монстров
   - Расчет наград на основе сложности

## Миграция существующего кода

### Шаг 1: Найти прямое использование localStorage

```bash
# Поиск уязвимых мест
grep -r "localStorage.getItem.*gameBalance" src/
grep -r "localStorage.setItem.*gameBalance" src/
```

### Шаг 2: Заменить на Zustand store

```typescript
// Было
const balance = Number(localStorage.getItem('gameBalance') || '0');
localStorage.setItem('gameBalance', String(newBalance));

// Стало
const balance = useGameStore(state => state.balance);
const { setBalance } = useGameStore();
setBalance(newBalance); // Автосинхронизация с сервером
```

### Шаг 3: Для редких случаев когда нужен localStorage

```typescript
// Если ОБЯЗАТЕЛЬНО нужен localStorage (например, для кэша)
import { secureSetItem, secureGetItem } from '@/utils/secureStorage';

await secureSetItem('gameBalance', balance, accountId);
const balance = await secureGetItem<number>('gameBalance', accountId);
```

## Рекомендации разработчикам

1. **Всегда используйте Zustand store** для критических данных
2. **Никогда не доверяйте** данным из localStorage для бизнес-логики
3. **Всегда валидируйте** операции на сервере
4. **Используйте RPC функции** для всех изменений данных
5. **Логируйте** подозрительные действия

## Дополнительные меры (рекомендуется)

### 1. Rate Limiting
Ограничение количества операций в минуту на уровне Edge Functions

### 2. Anomaly Detection
Обнаружение подозрительных паттернов:
- Слишком быстрые победы в подземельях
- Необычный рост баланса
- Невозможные комбинации предметов

### 3. Audit Log
Логирование всех критических операций для расследования

### 4. Admin Tools
Панель администратора для:
- Просмотра истории транзакций
- Отката читерских операций
- Бана нечестных игроков

## Тестирование безопасности

```typescript
// Тест: попытка подделки баланса
localStorage.setItem('gameBalance', '999999999');
const balance = useGameStore.getState().balance;
// balance должен быть реальным значением из Supabase, а не 999999999

// Тест: попытка купить предмет с поддельным балансом
localStorage.setItem('gameBalance', '999999999');
await handlePurchase('expensive_item');
// Должна вернуться ошибка "Insufficient balance"
```

## Что делать если обнаружен читер

1. **Проверьте логи** Edge Functions на подозрительные запросы
2. **Проверьте БД** на аномальные изменения в game_data
3. **Откатите данные** через admin панель
4. **Забаньте** если необходимо через whitelist систему

## Заключение

Многоуровневая защита обеспечивает:
- ✅ Затруднение читерства на клиенте (подписи)
- ✅ Полная защита на сервере (валидация)
- ✅ Мониторинг и быстрое обнаружение (логи)
- ✅ Возможность восстановления (откат данных)

**Главный принцип:** localStorage - это только кэш для UI. 
Все важные решения принимаются на сервере!
