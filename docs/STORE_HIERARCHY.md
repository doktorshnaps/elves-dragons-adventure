# Store Hierarchy Architecture

## Архитектура хранения данных

```
┌─────────────────────────────────────────────────────────────┐
│                     Level 1: Database                        │
│                   Supabase PostgreSQL                        │
│                  (Source of Truth)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ RPC Functions + Real-time
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Level 2: React Query                        │
│              (Server State Management)                       │
│                                                              │
│  • Кеширование (staleTime, gcTime)                          │
│  • Автоматическая инвалидация через Real-time               │
│  • Оптимистичные обновления                                 │
│  • Query Profiling для N+1 детекции                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ useQuery hooks
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Level 3: Zustand                           │
│            (Global Application State)                        │
│                                                              │
│  • UI состояние (модальные окна, навигация)                 │
│  • Временное состояние (бои, анимации)                      │
│  • Derived state из React Query                             │
│  • НЕ хранит серверные данные                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Hooks + Selectors
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Level 4: Components                         │
│                  (Presentation)                              │
│                                                              │
│  • Читают из React Query через контекст провайдеры          │
│  • Используют Zustand для UI состояния                      │
│  • Оптимистичные обновления для UX                          │
│  • Не содержат бизнес-логики                                │
└─────────────────────────────────────────────────────────────┘
```

## Level 1: Database (Supabase PostgreSQL)

### Принципы
- **Single Source of Truth**: База данных — единственный источник истины
- **RPC Functions**: Агрегированные запросы для снижения N+1 queries
- **Real-time Subscriptions**: Автоматическая синхронизация изменений
- **JSONB Validation**: Runtime validation через Zod schemas

### Оптимизации
```sql
-- Оптимизированные RPC с JOIN'ами
get_card_instances_by_wallet_optimized()  -- JOIN с item_templates
get_game_data_by_wallet_full_v2()         -- Агрегированные подсчеты

-- Индексы для быстрых JOIN'ов
idx_card_instances_template_id            -- Для JOIN с workers
idx_card_instances_wallet_marketplace     -- Для фильтрации
```

### JSONB Validation
```typescript
import { validateCardData, validateBuildingLevels } from '@/utils/jsonbValidation';

// Валидация card_data из БД
const cardData = validateCardData(rawCardData);

// Валидация building_levels с fallback
const buildingLevels = validateBuildingLevels(rawBuildingLevels);
```

## Level 2: React Query (Server State)

### Принципы
- **Агрессивное кеширование**: `staleTime: 5-10min`, `gcTime: 10-30min`
- **Selective Invalidation**: Инвалидация только измененных данных
- **Real-time Sync**: Подписки на INSERT/UPDATE/DELETE
- **Query Profiling**: Автоматическое отслеживание N+1 queries

### Паттерны

#### ✅ ПРАВИЛЬНО: Context Provider
```typescript
// CardInstancesProvider.tsx
export const CardInstancesProvider = ({ children }) => {
  const { data: cardInstances } = useQuery({
    queryKey: ['cardInstances', walletAddress],
    queryFn: () => supabase.rpc('get_card_instances_by_wallet_optimized', {...}),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <CardInstancesContext.Provider value={{ cardInstances }}>
      {children}
    </CardInstancesContext.Provider>
  );
};

// Компоненты читают через контекст
const { cardInstances } = useCardInstancesContext();
```

#### ❌ НЕПРАВИЛЬНО: Множественные вызовы
```typescript
// ❌ НЕ ДЕЛАТЬ: N+1 queries
function Component1() {
  const { data } = useQuery(['cards', wallet], fetchCards); // 1-й запрос
}

function Component2() {
  const { data } = useQuery(['cards', wallet], fetchCards); // 2-й запрос (дубликат!)
}
```

### Selective Invalidation
```typescript
import { invalidateSelective } from '@/utils/selectiveInvalidation';

// Инвалидируем только измененные данные
await invalidateSelective(walletAddress, {
  balance: true,        // ✅ Только баланс
  itemInstances: true,  // ✅ Только предметы
  shop: true,           // ✅ Только магазин
  // cardInstances: false - НЕ инвалидируем карты
});
```

### Query Profiling
```typescript
// В консоли браузера
window.queryProfiler.report();  // Показать отчет
window.queryProfiler.clear();   // Очистить метрики
window.queryProfiler.stats();   // Получить статистику

// Автоматическое предупреждение при N+1:
// ⚠️ N+1 query detected: "['cardInstances','mr_bruts.tg']"
// Count: 5 queries in 5000ms
```

## Level 3: Zustand (Application State)

### Принципы
- **Только UI состояние**: Модальные окна, навигация, загрузка
- **Временное состояние**: Данные боя, анимации (не синхронизируются до завершения)
- **Derived State**: Вычисляемые значения из React Query
- **НЕ серверные данные**: Никогда не хранить balance, cards, items

### Stores

#### UI Store
```typescript
import { useUIStore } from '@/stores/storeHierarchy';

const { openShop, isShopOpen, closeShop } = useUIStore();

<Button onClick={openShop}>Open Shop</Button>
{isShopOpen && <ShopModal onClose={closeShop} />}
```

#### Battle Store
```typescript
import { useBattleStore } from '@/stores/storeHierarchy';

const { startBattle, incrementKills, endBattle } = useBattleStore();

// Начало боя
startBattle(5);

// Во время боя (все локально в Zustand)
incrementKills();
addDamage(150);

// Завершение - отправка в БД через React Query mutation
const battleData = useBattleStore.getState();
await claimBattleRewards({ 
  monstersKilled: battleData.monstersKilled,
  damageDealt: battleData.damageDealt
});
endBattle();
```

### ❌ Анти-паттерны

```typescript
// ❌ НЕ ХРАНИТЬ серверные данные в Zustand
interface GameStore {
  balance: number;           // ❌ Должно быть в React Query
  cards: Card[];            // ❌ Должно быть в React Query
  setBalance: (n) => void;  // ❌ Используйте mutation
}

// ❌ НЕ ДУБЛИРОВАТЬ данные
const gameData = useGameDataContext();
const zustandBalance = useGameStore(state => state.balance); // ❌ Дубликат!
```

## Level 4: Components (Presentation)

### Принципы
- **Read from Context**: Читать данные через context providers
- **UI State from Zustand**: Использовать Zustand только для UI
- **Optimistic Updates**: Через React Query mutations
- **No Business Logic**: Вся логика в хуках/сервисах

### Паттерны

#### ✅ ПРАВИЛЬНО: Чтение через контекст
```typescript
const ShopComponent = () => {
  const { gameData } = useGameDataContext();          // Server state
  const { cardInstances } = useCardInstancesContext(); // Server state
  const { isShopOpen, closeShop } = useUIStore();     // UI state

  const balance = gameData?.balance || 0;
  
  return (
    <Dialog open={isShopOpen} onClose={closeShop}>
      <p>Balance: {balance} ELL</p>
      <p>Cards: {cardInstances.length}</p>
    </Dialog>
  );
};
```

#### ✅ ПРАВИЛЬНО: Оптимистичные обновления
```typescript
const { mutate: purchaseItem } = useMutation({
  mutationFn: (itemId) => supabase.functions.invoke('shop-purchase', { body: { item_id: itemId }}),
  
  onMutate: async (itemId) => {
    // Оптимистичное обновление UI
    queryClient.setQueryData(['shopData', wallet], (old) => ({
      ...old,
      balance: old.balance - itemPrice,
      inventory: [...old.inventory, itemId]
    }));
  },
  
  onError: (error, variables, context) => {
    // Откат при ошибке
    queryClient.setQueryData(['shopData', wallet], context.previousData);
  },
  
  onSuccess: () => {
    // Selective invalidation
    invalidateSelective(wallet, { balance: true, itemInstances: true, shop: true });
  }
});
```

## Миграция с плохого паттерна

### Плохой паттерн (ДО)
```typescript
// ❌ Хранение серверных данных в Zustand
const useGameStore = create((set) => ({
  balance: 0,
  cards: [],
  setBalance: (balance) => set({ balance }),
  fetchGameData: async (wallet) => {
    const data = await supabase.from('game_data').select();
    set({ balance: data.balance, cards: data.cards });
  }
}));

// Компоненты
function Component() {
  const { balance, fetchGameData } = useGameStore();
  
  useEffect(() => {
    fetchGameData(wallet); // ❌ Ручная синхронизация
  }, [wallet]);
  
  return <p>{balance}</p>;
}
```

### Хороший паттерн (ПОСЛЕ)
```typescript
// ✅ React Query для серверного состояния
const useGameData = (wallet) => {
  return useQuery({
    queryKey: ['gameData', wallet],
    queryFn: () => supabase.from('game_data').select().single(),
    staleTime: 5 * 60 * 1000,
  });
};

// ✅ Zustand только для UI
const useUIStore = create((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
}));

// Компоненты
function Component() {
  const { data: gameData } = useGameData(wallet); // ✅ Автоматическая синхронизация
  const { isModalOpen, openModal } = useUIStore(); // ✅ UI состояние
  
  return (
    <>
      <p>{gameData?.balance}</p>
      <Button onClick={openModal}>Open</Button>
    </>
  );
}
```

## Best Practices

### 1. Централизованные провайдеры
```typescript
// App.tsx
<QueryProvider>
  <GameDataProvider>
    <CardInstancesProvider>
      <ItemInstancesProvider>
        <Routes />
      </ItemInstancesProvider>
    </CardInstancesProvider>
  </GameDataProvider>
</QueryProvider>
```

### 2. Selective Invalidation
```typescript
// ✅ Инвалидируем только то, что изменилось
await invalidationPresets.afterShopPurchase(wallet);

// ❌ НЕ инвалидируем всё подряд
queryClient.invalidateQueries(); // Слишком широко!
```

### 3. Query Profiling
```typescript
// Регулярно проверяем N+1 queries
if (import.meta.env.DEV) {
  setInterval(() => {
    window.queryProfiler.report();
  }, 30000); // Каждые 30 секунд
}
```

### 4. JSONB Validation
```typescript
// Всегда валидируем JSONB из БД
const buildingLevels = validateBuildingLevels(rawData.building_levels);
const activeWorkers = validateActiveWorkers(rawData.active_workers);
```

## Troubleshooting

### Проблема: N+1 Queries
```typescript
// ❌ Проблема: множественные вызовы одного RPC
GET_INSTANCES_DEBUG: get_card_instances_by_wallet called for wallet=mr_bruts.tg (5 раз)

// ✅ Решение: Централизованный провайдер
<CardInstancesProvider>
  {/* Все компоненты читают из одного запроса */}
</CardInstancesProvider>
```

### Проблема: Stale Data
```typescript
// ❌ Проблема: данные не обновляются после мутации
const { mutate } = useMutation(purchaseItem);

// ✅ Решение: Selective invalidation + Real-time
const { mutate } = useMutation({
  mutationFn: purchaseItem,
  onSuccess: () => {
    invalidateSelective(wallet, { balance: true, itemInstances: true });
  }
});

// + Real-time subscription автоматически инвалидирует при INSERT
```

### Проблема: Дублирование состояния
```typescript
// ❌ Проблема: данные в двух местах
const gameData = useGameDataContext();
const balance = useGameStore(s => s.balance); // Дубликат!

// ✅ Решение: Single source of truth
const { gameData } = useGameDataContext(); // Только React Query
const balance = gameData?.balance || 0;
```
