

## Исправление бесконечного цикла рендеринга в лагере

### Корень проблемы

Файл `src/hooks/useBuildingUpgrades.ts` содержит **бесконечный цикл** между двумя useEffect:

1. **Sync effect (строка 42-69)**: при каждом изменении `gameData.activeBuildingUpgrades` (новая ссылка из React Query кэша) безусловно вызывает `setActiveUpgrades(dbUpgrades)`.
2. **Auto-transition effect (строка 75-99)**: при изменении `activeUpgrades` проверяет таймер → устанавливает `status: 'ready'` → вызывает `syncToCache()` + `batchUpdate()`.
3. `syncToCache` обновляет React Query кэш → `gameData.activeBuildingUpgrades` получает НОВУЮ ссылку → снова срабатывает sync effect из шага 1.
4. `batchUpdate` → `updateGameData` → ещё одно обновление кэша → ещё одна новая ссылка → sync effect → цикл повторяется.

Каждый цикл выдаёт: `"Auto-transitioning upgrades to ready"` + `"Optimistic update - setting balance to: 445"`. В логе это повторяется **сотни раз**, полностью замораживая UI.

### Решение

Исправить `src/hooks/useBuildingUpgrades.ts`:

1. **В sync effect**: не вызывать `setActiveUpgrades` если данные семантически идентичны текущему состоянию. Сравнивать по `JSON.stringify` или по `buildingId + status`, чтобы новая ссылка из кэша не запускала лишний цикл.

2. **В auto-transition effect**: после одного успешного перехода в `ready` записать это в ref (`transitionedRef`), чтобы повторные срабатывания для того же upgrade игнорировались. Убрать `syncToCache()` из этого эффекта — достаточно одного `batchUpdate`, который сам обновит кэш через `updateGameData`.

3. **Убрать дублирующий interval effect (строка 102-136)**: он делает то же самое, что auto-transition effect, создавая вторую точку входа в тот же цикл. Логику toast перенести в auto-transition effect.

4. **Один вызов записи**: вместо `syncToCache()` + `batchUpdate()` (оба пишут в кэш), оставить только `batchUpdate()`, который через `updateGameData` уже делает оптимистичное обновление кэша.

### Технические детали

Файл для правки: `src/hooks/useBuildingUpgrades.ts`

Sync effect — добавить сравнение:
```typescript
useEffect(() => {
  const dbUpgrades = gameData.activeBuildingUpgrades;
  if (!Array.isArray(dbUpgrades)) { /* fallback logic */ return; }
  
  // Не обновлять если данные идентичны
  const currentKey = JSON.stringify(activeUpgrades.map(u => ({ id: u.buildingId, s: u.status })));
  const newKey = JSON.stringify(dbUpgrades.map(u => ({ id: u.buildingId, s: u.status })));
  if (currentKey === newKey && activeUpgrades.length === dbUpgrades.length) return;
  
  // ... остальная логика
}, [gameData.activeBuildingUpgrades]);
```

Auto-transition effect — добавить ref-guard и убрать syncToCache:
```typescript
const transitionedRef = useRef<Set<string>>(new Set());

useEffect(() => {
  if (activeUpgrades.length === 0 || !accountId) return;
  const now = Date.now();
  let changed = false;
  const updated = activeUpgrades.map(upgrade => {
    const key = `${upgrade.buildingId}_${upgrade.startTime}`;
    if (now >= upgrade.startTime + upgrade.duration 
        && upgrade.status !== 'ready' 
        && !transitionedRef.current.has(key)) {
      transitionedRef.current.add(key);
      changed = true;
      return { ...upgrade, status: 'ready' as const };
    }
    return upgrade;
  });
  if (changed) {
    setActiveUpgrades(updated);
    // Только batchUpdate, без syncToCache
    gameState.actions.batchUpdate({ activeBuildingUpgrades: updated }).catch(...);
  }
}, [activeUpgrades, accountId]);
```

Удалить interval effect целиком (строки 102-136) — toast вынести в auto-transition.

### Проверка после внедрения
- Запустить улучшение здания
- Дождаться окончания таймера
- Открыть лагерь
- Убедиться: нет бесконечного повторения логов, UI не зависает, здание отображается как готовое к установке

