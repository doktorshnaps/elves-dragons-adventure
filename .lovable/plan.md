## Гостевой режим на /auth — демо-аккаунт read-only

### Концепция

Гость = подмена `accountId` на фиксированный демо-кошелёк из БД (`guest-demo.near`). Под капотом весь UI работает как обычно (`useWalletContext().accountId` отдаёт демо-адрес), данные читаются из реальной таблицы `game_data`/`card_instances`/`player_teams` демо-аккаунта, но все мутации блокируются клиентским guard'ом + RLS на стороне БД (демо-кошелёк не имеет admin-прав, а edge-функции получают `wallet_address` от клиента — guard ловит до отправки).

Демо-аккаунт = обычная запись в БД, наполняется вручную через админку (создать кошелёк `guest-demo.near`, дать ему карты/здания). В коде хардкод-константа `GUEST_DEMO_WALLET = 'guest-demo.near'`.

### Изменения

**1. `src/contexts/WalletConnectContext.tsx`**
- Добавить `isGuest: boolean` и `enterGuestMode(): void`, `exitGuestMode(): Promise<void>` в контекст.
- При маунте читать `localStorage.getItem('guestMode') === 'true'` → если да и нет реального кошелька, выставить `accountId = GUEST_DEMO_WALLET`, `isGuest = true`, `isLoading = false`.
- `enterGuestMode()`: пишет `guestMode=true` + `walletConnected=true` в localStorage, выставляет state, инвалидирует react-query кэш.
- `exitGuestMode()`: удаляет `guestMode`, очищает localStorage как в `disconnect()`, чистит react-query кэш, редирект на /auth.
- `connect()`: если уже `isGuest`, сначала вызвать `exitGuestMode()`, потом обычный коннект.

**2. `src/utils/guestMode.ts` (новый)**
```ts
export const GUEST_DEMO_WALLET = 'guest-demo.near';
export const isGuestWallet = (id: string | null) => id === GUEST_DEMO_WALLET;
// Хук-обёртка: возвращает {isGuest, blockIfGuest(featureName)}
export const useGuestGuard = () => {
  const { isGuest } = useWalletContext();
  const { toast } = useToast();
  const blockIfGuest = (feature: string) => {
    if (!isGuest) return false;
    toast({ title: 'Гостевой режим', description: `${feature} недоступно. Подключите кошелёк.`, variant: 'destructive' });
    return true;
  };
  return { isGuest, blockIfGuest };
};
```

**3. `src/pages/Auth.tsx`**
- Под основной кнопкой подключения — вторичная кнопка «Войти как гость» (ghost-стиль) с подписью «Ознакомление без покупок и сохранения прогресса».
- onClick → `enterGuestMode()` → `navigate('/menu')`.
- Добавить переводы `auth.guestButton`, `auth.guestSubtitle` в `src/utils/translations.ts` (RU/EN).

**4. `src/components/layout/GuestBanner.tsx` (новый)**
- Фикс-полоса сверху (sticky, z-50) с текстом «🎭 Гостевой режим — прогресс не сохраняется» + кнопка «Подключить кошелёк» (вызывает `exitGuestMode()` → редирект на /auth).
- Рендерится только если `isGuest`. Монтируется в `GameLayout.tsx` поверх контента.

**5. Блокировка мутаций (guard через `useGuestGuard().blockIfGuest`)**

В каждом из этих обработчиков в самом начале:
```ts
if (blockIfGuest('Покупки в магазине')) return;
```

- **Магазин**: `src/components/Shop.tsx` / `src/pages/ShopPage.tsx` — обработчик покупки.
- **Колоды/команды**: `src/components/game/team/*` (поиск через `rg "saveTeam\|player_teams"`), все `handleSave/handleAddCard/handleRemoveCard`.
- **Подземелья**: `src/components/dungeon/DungeonControls.tsx` / `ActiveDungeonButton.tsx` — кнопка «Войти в подземелье».
- **PvP**: `src/pages/PvP.tsx` — кнопка поиска матча.
- **Кланы**: `src/pages/Clan.tsx` — create/join/leave/donate.
- **Telegram/настройки**: `src/components/SettingsMenu.tsx` — сохранение chat_id, смена display name.
- **Зелья/предметы**: продажа предметов, открытие паков, форж, медпункт.
- **`useGameInitialization`**: НЕ создавать game_data для гостя (early return если `isGuestWallet(accountId)`).
- **`useGameInitialization` → `saveTelegramChatId`**: skip для гостя.

**6. `src/components/ProtectedRoute.tsx`**
- `lsConnected` теперь учитывает и `guestMode === 'true'`. Уже окей через `walletConnected=true`, но добавить дополнительную проверку в комментарии.

### Что НЕ трогаю

- Edge-функции и RLS — БД-уровень не модифицирую. Защита чисто клиентская (для read-only ознакомления этого достаточно; даже если гость хакнет UI и отправит мутацию с `wallet_address='guest-demo.near'`, демо-аккаунт пострадает только сам, что не критично — это публичный демо).
- Архитектуру `WalletContext` за пределами добавления `isGuest`/`enterGuestMode`/`exitGuestMode`.
- Логику NEAR-селектора, HotConnector, реферал, Telegram WebApp init.

### Создание демо-аккаунта (off-code, вне этого PR)

После мерджа: админ заходит в админку, выставляет себе временно `guest-demo.near` через Hot Wallet (или создаёт запись через game-wipe → import), даёт ему 5–10 карт, прокачивает здания. Альтернатива — добавлю отдельную миграцию-сид, если скажете «да, засеять».

### Проверка

1. `/auth` → видна вторая кнопка «Войти как гость» → клик → редирект на `/menu`, сверху баннер.
2. Баннер виден на всех страницах. Кнопка «Подключить кошелёк» в баннере чистит гость-режим и кидает на `/auth`.
3. В магазине нажать «Купить» → toast «Гостевой режим: Покупки в магазине недоступно».
4. Попытка сохранить команду / войти в подземелье / встать в PvP-очередь / создать клан / включить Telegram → аналогичный toast, ничего не отправляется в БД.
5. Просмотр карт, зданий, профиля, лидербордов — работает.
6. F5 на любой странице в гостевом режиме — состояние сохраняется (через `localStorage.guestMode`).
7. Подключение реального кошелька через баннер → гость-флаг сбрасывается, грузится реальный аккаунт.

### Открытый вопрос

Адрес демо-аккаунта: использовать `guest-demo.near` (нужно создать вручную после мерджа), или укажете существующий кошелёк, который уже хорошо заполнен и не жалко показать публично?
