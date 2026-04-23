

## Ошибка «Failed to get challenge» при выходе после смерти карт

### Диагноз

В edge-логах видно последовательность для `mr_bruts.tg`:

```
582333  ✅ get-claim-challenge → nonce ОК
583651  ✅ claim-battle-rewards → rewards applied (победа на ур.1)
587948  ✅ end-dungeon-session → сессия удалена
589627  ❌ get-claim-challenge → "Session not found" (PGRST116)
```

То есть фронт ПОВТОРНО запрашивает challenge с тем же `claim_key=6b334be9` уже после того, как сессия удалена.

В коде `TeamBattlePage.tsx` (строки 979–993) экран **полного поражения** («Команда побеждена / Награды нет») имеет кнопку «Выйти», которая вызывает `handleClaimAndExit`. Эта функция:

1. Берёт `getCurrentClaimKey()` (старый или текущий claim_key из localStorage),
2. Запускает `claimRewardAndExit(capturedClaimKey, …)`,
3. Внутри идёт в `claimBattleRewardsUtil` → `get-claim-challenge`.

Но к моменту нажатия «Выйти» сессия уже могла быть закрыта (предыдущий уровень завершился победой и `end-dungeon-session` отработал, либо real-time/keep-alive стёрли сессию). Кроме того, защита `isDefeatedRef.current` теряется при перемонтировании хука `useDungeonRewards`. Результат — `get-claim-challenge` отвечает 404, фронт показывает красный тост «Failed to get challenge: Edge Function returned a non-2xx status code», игрок зависает на экране ошибки.

При этом **никаких наград начислять при полном поражении не нужно** — `processDungeonCompletion` уже сбрасывает `pendingReward = null` и `accumulatedReward = null`. Нужен только: сохранить здоровье/броню (включая `0`) мёртвых карт + закрыть сессию + выйти.

### Решение

Маршрутизировать кнопку «Выйти» на экране поражения через **существующую** функцию `handleSurrenderWithSave`, которая уже делает ровно то, что нужно:

- Собирает `cardHealthUpdates` (включая мёртвые карты с `current_health=0`),
- Вызывает `claimRewardAndExit(null, cardHealthUpdates, …)` — путь `shouldSkipRewards=true`, без challenge/claim,
- Делает `handleExitAndReset()` (зачистка Zustand, localStorage, `end-dungeon-session`, инвалидация кэша, navigate).

То есть на экране поражения мы НЕ ходим за challenge вовсе — сразу batch-апдейт здоровья и чистый выход.

### Правка (1 файл)

`src/components/game/battle/TeamBattlePage.tsx`, строка 989:

```tsx
// Было
<Button variant="menu" onClick={handleClaimAndExit}>
  {t(language, 'battlePage.exit')}
</Button>

// Стало
<Button variant="menu" onClick={handleSurrenderWithSave}>
  {t(language, 'battlePage.exit')}
</Button>
```

Дополнительно: в блоке экрана ошибки claim (строки 949–973) на кнопке «Сдаться и выйти» (963–967) уже стоит `handleSurrenderWithSave` — это правильная ссылка-эталон, ничего не трогаю.

### Что НЕ трогаю

- `handleClaimAndExit` — продолжает обслуживать кнопку «Выйти» в модалке наград (`DungeonRewardModal.onClose`) при победе/частичном прохождении. Там challenge/claim необходимы.
- `get-claim-challenge` edge-функция — её ответ 404 при отсутствии сессии корректен, это защитная проверка.
- `claim-battle-rewards`, `end-dungeon-session`, `claimRewardAndExit`, `useDungeonRewards` — логика верна, проблема была только в неправильном вызове из UI поражения.
- `isDefeatedRef` — оставляю как дополнительную защиту, но больше на неё не полагаемся в этом сценарии.

### Проверка

1. Зайти в подземелье → довести команду до смерти всех карт.
2. На экране «Команда побеждена / Награды нет» нажать «Выйти».
3. Ожидаемо: тосты «Сдача» → «Состояние сохранено» → переход на `/dungeons`. **Никакого красного тоста «Ошибка начисления наград»** не появляется.
4. В edge-логах нет новых вызовов `get-claim-challenge` после `end-dungeon-session`.
5. Здоровье мёртвых карт сохранилось в БД как `0` (карты остаются мертвыми и попадают в обычный поток медпункта/удаления из команд).

