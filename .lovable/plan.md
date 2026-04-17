

## Оптимизация iOS: тапы не реагируют, приложение перезагружается (браузер + Telegram WebApp)

### Подтверждено
- Проблема и в Safari iPhone, и в Telegram WebApp на iPhone (одинаковый WKWebView под капотом — значит причина общая, фикс один).
- В рантайме уже есть симптомы: `Failed to fetch dynamically imported module: /src/pages/Shelter.tsx` → ErrorBoundary → "Ошибка загрузки" → пользователь жмёт "Повторить" по 2-3 раза. Это и есть «не реагирует с первого раза + перезагружается».
- `⚠️ [ProtectedRoute] Loading timeout, forcing render` — форсированный ре-рендер маскирует реальное состояние загрузки.
- Memory pressure: `useCardInstances Loaded 1000 card instances`, сотни логов `getTemplate` в hot-path → WKWebView Jetsam kill на iPhone.

### Корневые причины (приоритет по влиянию)

**1. Lazy chunk fetch fail (главная причина «перезагрузок» и «не реагирует»)**
Vite разбивает страницы на динамические чанки. На iOS WKWebView в Telegram сеть нестабильная, чанк не догружается → `TypeError: Failed to fetch dynamically imported module` → весь экран падает в ErrorBoundary. Игроку кажется, что «приложение перезагрузилось». Нужен авто-retry для динамических импортов + soft reload при провале.

**2. iOS tap delay / двойные обработчики touch+mouse**
В `GameControls` и других местах используется `onMouseDown` + `onTouchStart` одновременно. На iOS это даёт «съеденный» первый тап + 300ms задержку. Глобально нет `touch-action: manipulation` на кнопках.

**3. Memory pressure → Jetsam kill**
1000 card_instances + сотни console.log `getTemplate` + рендер MedicalBay/Forge без виртуализации → iOS убивает вкладку. После kill WKWebView сам перезагружает страницу.

**4. ProtectedRoute force-render loop**
Каждый раз при таймауте форсируется render, тяжёлые провайдеры пере-инициализируются → лишние ресурсы.

### План фикса (минимальный, прицельный)

**A. Retry для lazy-импортов (критично, фиксит «перезагрузки»)**
- Файл `src/utils/lazyLoading.tsx`: обернуть `lazy(() => import(...))` в helper `lazyWithRetry`, который при ошибке делает 2-3 retry с задержкой 300/800/1500ms. После исчерпания — soft reload текущего роута, а не падение в ErrorBoundary.
- В ErrorBoundary при ошибке вида "Failed to fetch dynamically imported module" — автоматический `location.reload()` один раз (с защитой от цикла через sessionStorage flag).

**B. iOS tap fix (критично, фиксит «не реагирует с первого раза»)**
- `src/index.css`: глобально добавить
  ```css
  button, [role="button"], a { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  html { -webkit-text-size-adjust: 100%; }
  ```
- `src/components/game/adventures/components/GameControls.tsx`: заменить пары `onMouseDown/onTouchStart` на `onPointerDown/onPointerUp` (единый Pointer Events API, работает на touch и mouse одинаково на iOS 13+).

**C. Снизить memory pressure**
- Завернуть массовые отладочные `console.log` (`getTemplate`, `useFactionElements`, `useCardInstances Loaded`) в `if (import.meta.env.DEV)`. На проде логов быть не должно.
- В `MedicalBayComponent` мемоизировать `injuredCards`/`deadCards` через `useMemo` с правильными зависимостями (сейчас на каждом рендере фильтрует 1000 карт).
- Проверить, не пересоздаётся ли массив `cardsInMedicalBay` на каждом рендере (если да — мемоизировать).

**D. ProtectedRoute**
- `src/components/ProtectedRoute.tsx`: убрать `forcing render` после таймаута или повысить таймаут до 8-10s. Force-render должен быть единичным, не на каждом тике.

**E. Telegram WebApp специфика**
- В `useTelegram` вызывать `tg.expand()` и `tg.ready()` в самом начале (если ещё не вызывается) — это предотвращает collapse WebView и связанные с этим re-mount'ы.
- Добавить `tg.disableVerticalSwipes?.()` на iOS, чтобы свайпы не закрывали окно случайно (восприни мается как «приложение пропало»).

### Файлы под изменение
- `src/utils/lazyLoading.tsx` — retry helper.
- `src/components/common/ErrorBoundary.tsx` — авто-reload на chunk-load fail.
- `src/index.css` — глобальный touch-action.
- `src/components/game/adventures/components/GameControls.tsx` — pointer events.
- `src/components/ProtectedRoute.tsx` — убрать force-render loop.
- `src/components/game/medical/MedicalBayComponent.tsx` — useMemo для фильтров.
- `src/hooks/useTelegram.ts` — ready/expand/disableVerticalSwipes.
- Поиск+правка hot-path `console.log` (getTemplate, useFactionElements) — обернуть в DEV.

### Что НЕ делаю
- Не переписываю архитектуру, не меняю Service Worker (он уже decommissioned), не лезу в Supabase/RLS — проблема чисто клиентская iOS.

### Проверка после фикса
- Открыть в Telegram на iPhone → перейти в /shelter, /team, /medical → кнопки реагируют с первого тапа, нет белого экрана/перезагрузки.
- Прогнать сценарий «отправить карту на лечение → вернуться в команду» без glitch'ей.

