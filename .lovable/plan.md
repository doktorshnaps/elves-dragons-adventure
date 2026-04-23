

## Награда после смерти команды + неправильный счётчик «1 из 2 карт»

### Две проблемы

**1. «Сохраняем 1 из 2 карт»** (скрин 2)

В `TeamBattlePage.tsx:647`:
```ts
description: `Сохраняем ${cardHealthUpdates.length} из ${battleState.playerPairs.length * 2} карт...`,
```
Знаменатель `playerPairs.length * 2` подразумевает, что в каждой паре всегда есть и герой, и дракон. Но в команде может быть только 1 герой без дракона → `1 / (1*2) = 1/2`. У игрока в команде была 1 карта — должно быть `1 из 1`.

**2. После смерти всей команды появляется «Забрать награду»** (скрин 1 + тост из скрина 2)

Тост `Сохраняем X из Y карт` приходит ТОЛЬКО из `handleClaimAndExit` (line 647). На экране поражения кнопка «Выйти» уже маршрутизирована на `handleSurrenderWithSave` (line 989) — без claim. Значит модалка `DungeonRewardModal` (line 1033) открывается ПОСЛЕ полного поражения и её `onClose={handleClaimAndExit}` (line 1035) триггерит claim-путь.

Условие открытия модалки: `!!pendingReward && !isClaiming && !claimResultModal.isOpen`. Экран поражения (line 979) показывается только если `!pendingReward && alivePairs.length === 0`. Если `pendingReward` остался от предыдущего уровня (например игрок выиграл ур.1, нажал «Продолжить», умер на ур.2), а `processDungeonCompletion(isDefeat=true)` не успел обнулить state до рендера — открывается модалка наград, и пользователь логично жмёт «Забрать», получая 0 ELL/0 XP/0 предметов и тост `Сохраняем 1 из 2 карт`.

Дополнительно в `useDungeonRewards.processDungeonCompletion` есть guard:
```ts
if (isProcessingRef.current) return;
```
который может проглотить вызов `isDefeat=true`, если предыдущая обработка ещё идёт — тогда `pendingReward` НЕ обнуляется и модалка остаётся.

### Исправление (1 файл клиента)

`src/components/game/battle/TeamBattlePage.tsx`:

**A. Правильный счётчик карт в тосте (строки 645–648):**

Заменить `playerPairs.length * 2` на реальное количество карт в команде:
```ts
const totalCards = battleState.playerPairs.reduce(
  (acc, pair) => acc + (pair.hero ? 1 : 0) + (pair.dragon ? 1 : 0),
  0
);
toast({
  title: "📤 Отправка данных",
  description: `Сохраняем ${cardHealthUpdates.length} из ${totalCards} карт...`,
});
```

**B. Приоритет экрана поражения над модалкой наград (строки 929–1059):**

В блоке `if (isBattleOver && battleStarted && !showingFinishDelay)` поднять проверку `alivePairs.length === 0` ВЫШЕ проверки `!pendingReward`. Если команда полностью побеждена — всегда показываем экран «Команда побеждена / Награды нет / Выйти» с `handleSurrenderWithSave`, **независимо** от того, остался ли `pendingReward`/`accumulatedReward` в памяти от предыдущих уровней. Перед рендером экрана поражения дополнительно вызвать `resetRewards()` через `useEffect`-страж (один раз на defeat), чтобы исключить «зомби-модалку».

Логика:
```text
isBattleOver && battleStarted:
  ├─ playerPairs пусто → очистить state, fall-through
  ├─ claimError → экран ошибки claim (как было)
  ├─ alivePairs.length === 0 → ЭКРАН ПОРАЖЕНИЯ (handleSurrenderWithSave) ✦ НОВЫЙ ПРИОРИТЕТ
  ├─ isClaiming → "Обработка результатов..."
  ├─ !pendingReward → "Обработка..."
  └─ default → DungeonRewardModal + ClaimRewardsResultModal (как было, для побед)
```

**C. Гарантированный сброс `pendingReward`/`accumulatedReward` при детекции поражения:**

В useEffect `Обработка завершения боя` (строки 893–927) после `processDungeonCompletion(... isDefeat=true)` добавить прямой `resetRewards()` через ссылку из `useDungeonRewards`. Это страховка от race condition с `isProcessingRef.current` в хуке наград.

### Что НЕ трогаю

- `useDungeonRewards.processDungeonCompletion` — внутренняя логика остаётся, добавляем только клиентскую страховку.
- `handleClaimAndExit` — продолжает обслуживать кнопку «Забрать» в `DungeonRewardModal` при настоящих победах/частичном прохождении.
- `handleSurrenderWithSave`, `claimRewardAndExit`, edge-функции — без изменений.
- Архитектуру наград, тосты `🚨 Сохранение прогресса`, итоговую модалку `ClaimRewardsResultModal` — не трогаю.
- `processDungeonCompletion` для побед — поведение «Победа → накопить → выбрать продолжить/забрать» сохраняется в полном объёме.

### Проверка

1. Команда из 1 карты → зайти в подземелье ур.1 → нажать «Сдаться» (или умереть) → тост: **`Сохраняем 1 из 1 карт...`**, не `1 из 2`.
2. Команда из 1 героя + 1 дракона (1 пара) → тост: `Сохраняем 2 из 2 карт`.
3. Победить ур.1 → нажать «Продолжить» → умереть на ур.2 → видим экран **«Команда побеждена / Награды нет»** с одной кнопкой «Выйти». **Никакой модалки «Забрать награду»** не появляется.
4. Победить ур.1 → нажать «Забрать награду» → нормальный flow с `ClaimRewardsResultModal` (как раньше, не сломали).
5. В консоли при поражении видно `🔄 Сброс всех наград` от резервного `resetRewards()` сразу после `processDungeonCompletion(isDefeat=true)`.

