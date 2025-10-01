# Анализ архитектуры игры и рекомендации по оптимизации

## Дата анализа: 2025-10-01

## 🔴 Критические проблемы

### 1. Множественная синхронизация состояний (CRITICAL)

**Проблема**: Из логов видно, что `cards` пересобираются из `card_instances` минимум 3 раза подряд:
```
🔄 Rebuilding cards from card_instances: {\"instancesCount\": 136, \"currentCardsCount\": 129}
🔄 Rebuilding cards from card_instances: {\"instancesCount\": 136, \"currentCardsCount\": 129}
✅ Updating gameData with all cards from instances
✅ Updating gameData with all cards from instances
```

**Причина**: Циклические зависимости между:
- `useCardInstanceSync` → `updateGameData` → Supabase → realtime update → `loadGameData` → `syncAllCardsFromInstances`

**Влияние**: 
- Лишние запросы к БД (3x запросов вместо 1)
- Медленная загрузка приложения
- Потенциальные race conditions

**Решение**:
```typescript
// Добавить debounce для синхронизации
const syncAllCardsFromInstances = useMemo(() => 
  debounce(async () => {
    // existing logic
  }, 500),
  [cardInstances, gameData.cards]
);

// Добавить флаг синхронизации
const isSyncingRef = useRef(false);
if (isSyncingRef.current) return;
isSyncingRef.current = true;
try {
  await updateGameData({ cards: cardsFromInstances });
} finally {
  isSyncingRef.current = false;
}
```

### 2. Дублирование источников истины

**Проблема**: Состояние хранится в 4 местах:
1. `useState` в компонентах
2. `localStorage` (множественные ключи)
3. Zustand store (`gameStore`)
4. Supabase database

**Файлы с дублированием**:
- `src/hooks/useGameData.ts` (409 строк, управляет всеми 4 источниками)
- `src/stores/gameStore.ts` (260 строк, дублирует данные)
- 57+ файлов используют `localStorage` напрямую

**Влияние**:
- Рассинхронизация данных
- Сложность поддержки
- Невозможно отследить источник изменений

**Решение**: Единый источник истины (Single Source of Truth)
```typescript
// Вариант 1: Zustand + Supabase middleware
export const useGameStore = create<GameState>()(
  persist(
    supabaseSync( // custom middleware
      (set, get) => ({ /* state */ }),
      { syncInterval: 5000 }
    ),
    { name: 'game-storage' }
  )
);

// Вариант 2: React Query + Supabase
const { data: gameData, mutate } = useQuery({
  queryKey: ['gameData', walletAddress],
  queryFn: () => fetchGameData(walletAddress),
  staleTime: 30000
});
```

### 3. Event-driven архитектура через window.dispatchEvent

**Проблема**: 56 мест используют `addEventListener`/`removeEventListener`:
- `cardsUpdate` - 10+ слушателей
- `inventoryUpdate` - 8+ слушателей
- `balanceUpdate` - 5+ слушателей
- `storage` - множественные слушатели

**Влияние**:
- Сложно отследить поток данных
- Memory leaks при неправильной очистке
- Множественные ререндеры

**Решение**: Использовать React Context или state management
```typescript
// Заменить на Context
export const GameDataContext = createContext<GameData | null>(null);

// Или использовать Zustand subscriptions
const unsubscribe = useGameStore.subscribe(
  state => state.cards,
  (cards) => { /* react to changes */ }
);
```

### 4. localStorage злоупотребление

**Проблема**: 347+ использований `localStorage` в 57 файлах:
- Множественные записи при каждом изменении
- Синхронные операции блокируют UI
- Нет контроля версий/миграций

**Примеры избыточных записей** (из `useGameData.ts:278-294`):
```typescript
localStorage.setItem('gameCards', ...);
localStorage.setItem('gameBalance', ...);
localStorage.setItem('gameInitialized', ...);
localStorage.setItem('gameInventory', ...);
// ... еще 10+ setItem подряд
```

**Влияние**:
- Блокировка главного потока
- Риск переполнения квоты (5-10MB)
- Медленная загрузка на мобильных

**Решение**:
```typescript
// 1. Batch записи через debounce
const batchedLocalStorageUpdate = debounce((updates: Record<string, any>) => {
  Object.entries(updates).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
}, 100);

// 2. Использовать IndexedDB для больших данных
import { openDB } from 'idb';

const db = await openDB('game-db', 1, {
  upgrade(db) {
    db.createObjectStore('cards');
    db.createObjectStore('inventory');
  }
});

// 3. Сжатие данных
import pako from 'pako';
const compressed = pako.deflate(JSON.stringify(data));
localStorage.setItem('cards', btoa(String.fromCharCode(...compressed)));
```

## 🟡 Высокоприоритетные проблемы

### 5. Отсутствие мемоизации в критических местах

**Проблема**: Пересчёты происходят на каждом рендере:

`src/hooks/useGameData.ts:169-205`:
```typescript
const deepEqual = (a: any, b: any) => {
  try { return JSON.stringify(a) === JSON.stringify(b); } 
  catch { return false; }
};
// Вызывается на каждом updateGameData без мемоизации
```

**Решение**:
```typescript
import { useMemo } from 'react';
import isEqual from 'lodash/isEqual'; // Или fast-deep-equal

const hasChanges = useMemo(() => 
  !isEqual(updates.cards, gameData.cards),
  [updates.cards, gameData.cards]
);
```

### 6. Throttling/Debouncing не везде применён

**Проблема**: Только батчинг добавлен, но:
- `updateGameData` вызывается без ограничения частоты в некоторых местах
- Event listeners не debounced
- Window resize events не throttled

**Места без защиты**:
- `src/hooks/useCardInstanceSync.ts:72` - `updateGameData` без debounce
- `src/components/game/dialogs/CardPackAnimation.tsx:127` - resize без throttle
- Множественные `addEventListener('storage')` без debounce

**Решение**:
```typescript
import { useDebouncedCallback, useThrottledCallback } from 'use-debounce';

const debouncedSync = useDebouncedCallback(
  (data) => updateGameData(data),
  500,
  { maxWait: 2000 }
);

const throttledResize = useThrottledCallback(
  () => handleResize(),
  200
);
```

### 7. Неоптимальные SQL запросы

**Проблема**: 
- `loadGameData` загружает все поля всегда
- Нет пагинации для больших коллекций
- Отсутствует частичная загрузка

**Текущий запрос** (`src/utils/gameDataLoader.ts`):
```typescript
const { data } = await supabase
  .from('game_data')
  .select('*') // Загружаем ВСЁ
  .eq('wallet_address', address);
```

**Решение**:
```typescript
// 1. Lazy loading для разных страниц
const loadGameDataMinimal = async (address: string) => {
  return supabase
    .from('game_data')
    .select('balance, account_level, account_experience')
    .eq('wallet_address', address)
    .single();
};

const loadCards = async (address: string, offset = 0, limit = 50) => {
  // Использовать отдельную таблицу или RPC с пагинацией
  return supabase.rpc('get_user_cards_paginated', {
    p_wallet_address: address,
    p_offset: offset,
    p_limit: limit
  });
};

// 2. Partial updates
const updateBalance = async (address: string, balance: number) => {
  return supabase
    .from('game_data')
    .update({ balance })
    .eq('wallet_address', address);
};
```

### 8. Card instances vs cards дублирование

**Проблема**: 
- Карты хранятся в `game_data.cards` (JSON) И в `card_instances` (таблица)
- Постоянная синхронизация между ними
- 136 instances, но 129 cards (7 workers исключены)

**Решение**: Выбрать единый источник
```typescript
// Вариант 1: Только card_instances (рекомендуется)
// Удалить поле cards из game_data
// Всегда загружать из card_instances с JOIN

// Вариант 2: Только game_data.cards
// Удалить таблицу card_instances
// Хранить health/timestamps внутри cards JSON

// Вариант 3: Hybrid (текущий, не рекомендуется)
// Оставить как есть, но добавить:
const syncDirection = 'instances_to_cards'; // или 'cards_to_instances'
const isSyncEnabled = useRef(true);
```

## 🟢 Среднеприоритетные улучшения

### 9. Отсутствие виртуализации для больших списков

**Проблема**: Рендер всех 129+ карт одновременно

**Решение**:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const CardList = ({ cards }) => {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => (
          <div key={item.key} style={/* positioning */}>
            <CardComponent card={cards[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 10. Отсутствие error boundaries

**Проблема**: Ошибки приводят к краш всего приложения

**Решение**:
```typescript
class GameErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Game error:', error, errorInfo);
    // Send to error tracking service
    trackError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <GameErrorFallback />;
    }
    return this.props.children;
  }
}

// Usage
<GameErrorBoundary>
  <GameContainer />
</GameErrorBoundary>
```

### 11. Нет кэширования для card database

**Проблема**: `cardDatabase.ts` импортируется во многих местах, но данные статичны

**Решение**:
```typescript
// Создать service worker для кэширования
// или использовать useMemo на уровне App
const CardDatabaseContext = createContext(cardDatabase);

// В корневом компоненте
const cachedDatabase = useMemo(() => cardDatabase, []);
```

### 12. Использование magic numbers/strings

**Проблема**: 
```typescript
localStorage.getItem('gameCards') // строка-ключ повторяется 50+ раз
HEAL_INTERVAL = 60 * 1000 // магические числа
```

**Решение**:
```typescript
// src/constants/storageKeys.ts
export const STORAGE_KEYS = {
  GAME_CARDS: 'gameCards',
  GAME_BALANCE: 'gameBalance',
  // ...
} as const;

// src/constants/gameConfig.ts
export const GAME_CONFIG = {
  HEAL_INTERVAL_MS: 60_000,
  HEAL_RATE_PER_MINUTE: 1,
  MAX_TEAM_SIZE: 5,
  // ...
} as const;
```

## 📊 Рекомендуемый план рефакторинга

### Фаза 1: Критические исправления (1-2 недели)

1. **Единый источник истины для игровых данных**
   - [ ] Мигрировать на Zustand + Supabase синхронизацию
   - [ ] Удалить прямые вызовы `localStorage.setItem`
   - [ ] Создать единый `useGameState` hook

2. **Исправить циклическую синхронизацию**
   - [ ] Добавить debounce в `useCardInstanceSync`
   - [ ] Добавить флаги синхронизации (isSyncing)
   - [ ] Логировать источники вызовов

3. **Оптимизировать localStorage использование**
   - [ ] Batch updates через debounce
   - [ ] Переместить большие данные в IndexedDB
   - [ ] Добавить версионирование для миграций

### Фаза 2: Высокоприоритетные (2-3 недели)

4. **Заменить event-driven на React patterns**
   - [ ] Создать GameDataProvider контекст
   - [ ] Удалить window.dispatchEvent вызовы
   - [ ] Использовать Zustand subscriptions

5. **Добавить мемоизацию**
   - [ ] useMemo для тяжёлых вычислений
   - [ ] React.memo для дорогих компонентов
   - [ ] useCallback для event handlers

6. **Оптимизировать DB запросы**
   - [ ] Lazy loading данных
   - [ ] Partial updates вместо full sync
   - [ ] Пагинация для коллекций

### Фаза 3: Среднеприоритетные (1-2 недели)

7. **UI оптимизации**
   - [ ] Виртуализация больших списков
   - [ ] Code splitting по роутам
   - [ ] Image lazy loading

8. **Developer Experience**
   - [ ] Error boundaries
   - [ ] Константы вместо magic values
   - [ ] TypeScript strict mode
   - [ ] Unit tests для критических функций

## 🎯 Метрики для отслеживания

### До оптимизации (текущее состояние):
- Время загрузки: ~3-5 секунд
- DB запросов при загрузке: ~10+
- localStorage операций: ~20+ за загрузку
- Пересинхронизаций cards: 3+ раза

### Целевые метрики:
- Время загрузки: <1.5 секунды
- DB запросов при загрузке: ≤3
- localStorage операций: ≤5 за загрузку
- Пересинхронизаций cards: 1 раз

## 🛠 Инструменты для мониторинга

### Добавить в проект:
```json
{
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.0.0",
    "why-did-you-render": "^8.0.0",
    "webpack-bundle-analyzer": "^4.10.0"
  }
}
```

### Использовать для анализа:
1. React DevTools Profiler
2. Chrome Performance tab
3. Supabase logs и analytics
4. Sentry для ошибок

## 💡 Архитектурные паттерны для применения

### 1. Repository Pattern для data access
```typescript
class GameDataRepository {
  private supabase: SupabaseClient;
  private cache: Map<string, any>;

  async getCards(walletAddress: string): Promise<Card[]> {
    const cached = this.cache.get(`cards:${walletAddress}`);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.data;
    }
    // fetch from DB
  }

  async updateCards(walletAddress: string, cards: Card[]): Promise<void> {
    // update DB and cache
  }
}
```

### 2. Command Pattern для game actions
```typescript
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
}

class SellCardCommand implements Command {
  async execute() { /* sell logic */ }
  async undo() { /* restore card */ }
}

const commandHistory: Command[] = [];
```

### 3. Observer Pattern вместо events
```typescript
class GameStateObserver {
  private observers: Set<(state: GameState) => void> = new Set();

  subscribe(fn: (state: GameState) => void) {
    this.observers.add(fn);
    return () => this.observers.delete(fn);
  }

  notify(state: GameState) {
    this.observers.forEach(fn => fn(state));
  }
}
```

## ⚠️ Риски при рефакторинге

1. **Потеря данных пользователей**
   - Решение: Тестировать миграции на копиях данных
   - Добавить rollback механизм

2. **Breaking changes для существующего кода**
   - Решение: Постепенная миграция с compatibility layer
   - Feature flags для новой логики

3. **Performance регрессии**
   - Решение: Benchmark тесты до/после
   - Мониторинг метрик в production

## 📝 Заключение

### Текущее состояние: ⚠️ 6/10
- Работает, но имеет серьёзные проблемы с производительностью
- Сложность поддержки высокая
- Риск рассинхронизации данных

### После оптимизаций: ✅ 9/10
- Быстрая загрузка и отклик
- Единый источник истины
- Легко поддерживать и расширять
- Меньше багов

### Приоритет #1: Исправить множественную синхронизацию
Это самая критичная проблема, влияющая на производительность прямо сейчас.

### Рекомендуемый подход:
1. Начать с Фазы 1, пункты 1-3
2. Измерить улучшения
3. Продолжить с Фазой 2
4. Непрерывно тестировать и мониторить
