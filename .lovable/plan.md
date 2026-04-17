

## Тапы реагируют через 3-5 секунд + перезагрузки страницы — углублённый фикс

### Что показывают свежие логи
- `⚠️ Slow RPC: get_card_instances_by_wallet (677.60ms)` + `Loaded 1000 card instances` — каждый запрос карт грузит 1000 объектов в JS heap.
- `⚠️ [ProtectedRoute] Loading timeout (8s), forcing render` — всё ещё срабатывает: 8 секунд блокировки UI это и есть «кнопка не отвечает 3-5 секунд», после форс-рендера тяжёлые провайдеры монтируются и перерисовывают всё.
- 3 NEAR RPC падают с таймаутами по 5 секунд каждый (`rpc.mainnet.near.org`, `pagoda.co`, `pagoda v1`) → блокирует main thread на сериализации ошибок.
- `WalletContext` инициализирует HotConnector ПОСЛЕ того, как страница уже отрендерилась → повторный mount `CardInstancesProvider` и `ItemInstancesProvider` (видно в логах дважды).
- 1000 карт + парсинг JSON в провайдере без чанкования = долгий long task → iOS WebKit морозит ввод.

### Корневые причины (новые, не покрытые прошлым фиксом)

**1. ProtectedRoute всё ещё блокирует UI на 8 секунд.**
Прошлый фикс заменил force-render loop на одноразовый таймер 8s, но сам gate остался: пока `maintenanceLoading || adminLoading || whitelistLoading` истинно — рендерится spinner, а не контент. Кнопки физически отсутствуют в DOM, поэтому «не реагируют». На iPhone с медленной сетью это и есть 3-5 секунд белого экрана + резкий маунт тяжёлого UI.

**2. Двойная инициализация провайдеров карт/предметов.**
В логах видно: `CardInstancesProvider Initializing` срабатывает 2 раза подряд (один до, один после `WalletContext HotConnector initialized`). Каждый раз — подписка на realtime + перезапрос 1000 карт. На iOS это два long task по ~700ms = заморозка ввода.

**3. NEAR balance fetch блокирует event loop.**
3 RPC × 5s timeout = 15 секунд background промисов с тяжёлыми Error-объектами. Сериализация ошибок (видно `_type: "Error", value: { stack: ... }`) — синхронная и тяжёлая на мобильном Safari.

**4. 1000 card_instances в одном useState/Context.**
Любое изменение → React сравнивает 1000 объектов → перерисовывает всех потребителей. На iPhone это ~200-400ms на каждый realtime тик.

**5. Кэш Service Worker / старый bundle.**
«Перезагружается страница» в Telegram WebApp часто = старый chunk пытается импортировать новый, не находит → reload. Прошлый фикс добавил retry + auto-reload в ErrorBoundary, но не очищает stale cache.

### План фикса (точечный, без переписывания)

**A. ProtectedRoute — рендерить контент оптимистично**
- Убрать gate на `adminLoading`/`whitelistLoading`/`maintenanceLoading` — это фоновые проверки, не блокируют UX.
- Оставить gate ТОЛЬКО на `isConnecting` (нужен walletAddress для запросов).
- Maintenance/admin/whitelist рендерить как overlay поверх контента, а не вместо него.
- Эффект: кнопки появляются в DOM моментально, тапы регистрируются с первого раза.

**B. Устранить двойную инициализацию провайдеров**
- В `CardInstancesProvider`/`ItemInstancesProvider` добавить guard: `if (!walletAddress || initializedFor.current === walletAddress) return;`
- Не подписываться на realtime, пока walletAddress не стабилизировался.

**C. NEAR balance fetch — non-blocking + короче таймауты**
- В `useNearBalances.ts` снизить per-RPC timeout с 5s до 2s.
- Запускать fetch через `requestIdleCallback` (fallback `setTimeout(.., 1000)`), чтобы не конкурировать с initial render.
- Не сериализовать stack trace ошибок — `console.warn(error.message)` вместо `console.warn(error)`.

**D. 1000 card_instances → пагинация на уровне Context**
- `useCardInstances`: вместо одного запроса `select *` — добавить серверную пагинацию (chunks по 200) + `useMemo` индексов по `card_instance_id` (Map вместо Array.find).
- Realtime subscription: дебаунс 200ms на batch-update, чтобы не было 10 ре-рендеров подряд.

**E. Bundle/chunk cache hygiene**
- В `index.html` или `vite.config.ts` добавить версионный query-string на entry (`?v=BUILD_HASH`).
- В Service Worker (если ещё активен): на activate — `caches.delete(...)` для старых версий.
- В ErrorBoundary при chunk-load fail: перед reload вызвать `navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))`.

**F. iOS-специфика — preventDefault на pointerdown**
- В `GameControls` (и любых кнопках в hot-path) добавить `e.preventDefault()` на `onPointerDown` — на iOS это убирает синтетический click через 300ms и убирает «двойное срабатывание».
- Глобально в `index.css`: `button { -webkit-touch-callout: none; user-select: none; }` — отключает long-press меню и selection, которые крадут tap.

**G. Логирование на проде**
- Найти оставшиеся `console.log/info` в hot-path (`GameDataContext`, `ProtectedRoute Status check`, `Auth`, `ReferralHandler`, `ItemInstancesProvider`, `useItemInstances`) — обернуть в `if (import.meta.env.DEV)`. На проде их быть не должно.

### Файлы под изменение (точный список)
- `src/components/ProtectedRoute.tsx` — убрать gate, рендерить overlay вместо блокировки.
- `src/hooks/useNearBalances.ts` — таймауты 2s, idle-старт, не логировать stack.
- `src/hooks/useCardInstances.ts` (+ Provider) — guard от двойного init, дебаунс realtime.
- `src/hooks/useItemInstances.ts` (+ Provider) — то же.
- `src/components/game/adventures/components/GameControls.tsx` — preventDefault в pointerdown.
- `src/index.css` — `-webkit-touch-callout: none`, `user-select: none` на кнопках.
- `src/components/common/ErrorBoundary.tsx` — unregister SW перед reload при chunk fail.
- `src/contexts/GameDataContext.tsx`, `src/components/auth/ReferralHandler.tsx`, `src/pages/Auth.tsx` — обернуть info-логи в DEV.

### Что НЕ делаю
- Не трогаю Supabase RLS, не меняю DB схему, не переписываю архитектуру стора.
- Не лезу в HotConnector/WalletContext (стабильно по memory `wallet-runtime-stability`).

### Проверка
- На iPhone Safari: открыть /menu → кнопки кликабельны через ~1 сек после загрузки (не 8 сек).
- В Telegram WebApp: тап с первого раза, нет белого экрана при переходе /shelter → /team → /medical.
- Console на проде: меньше 20 строк за загрузку страницы (сейчас 50+).

