

## Кнопка отключения анимаций карточек (для слабых устройств)

### Корень проблемы

Карточки редкости используют CSS-классы `rarity-shimmer` и `rarity-diamond` (анимированные градиенты-переливы). На слабых мобильных устройствах множественный рендер таких карт (инвентарь, магазин, выбор команды, бой) серьёзно нагружает GPU/CPU — фризы, нагрев, разряд батареи.

Сейчас классы навешиваются безусловно в:
- `src/components/game/cards/CardGrid.tsx`
- `src/components/game/battle/TeamCardDisplay.tsx`
- `src/components/shop/CardAnimation.tsx`
- и других местах через `getRarityStyle().shimmer`

### Решение

Глобальный пользовательский тумблер «Анимации карточек», который сохраняется в `localStorage` и при выключении полностью убирает shimmer/diamond эффекты со всех карточек.

### План

**1. Глобальное состояние настройки**

- Создать `src/hooks/useCardAnimationsSetting.ts`:
  - Читает/пишет `localStorage` ключ `card-animations-enabled` (по умолчанию `true`).
  - Эмитит событие `storage` + кастомный `card-animations-changed`, чтобы все подписчики обновлялись синхронно.
  - Возвращает `{ enabled, toggle, setEnabled }`.
- Применить через CSS-переменную/класс на `<html>`: при `enabled=false` добавлять класс `no-card-animations` к `document.documentElement`.

**2. CSS-killswitch**

- В `src/index.css` добавить:
  ```css
  .no-card-animations .rarity-shimmer,
  .no-card-animations .rarity-shimmer::before,
  .no-card-animations .rarity-shimmer::after,
  .no-card-animations .rarity-diamond,
  .no-card-animations .animate-card-glow {
    animation: none !important;
    background-image: none !important;
  }
  ```
- Это самый дешёвый способ: компоненты не трогаем, отрубается единым правилом.
- Дополнительно отключить тяжёлые `backdrop-blur` и `box-shadow`-glow в режиме «no-animations».

**3. UI переключателя**

- Добавить на странице настроек (`src/pages/Settings.tsx` — если есть) секцию «Производительность» с `Switch` «Анимации карточек».
- Если страницы настроек нет — добавить кнопку-иконку в меню `/menu` (рядом с языком) или в выпадающем меню профиля. Уточнить у пользователя предпочтительное место (см. вопрос ниже).
- Подпись + краткое описание: «Отключите для слабых устройств — уменьшит нагрев и разряд батареи».

**4. Авто-детекция (опционально, дефолт ON)**

- При первом запуске проверить `navigator.hardwareConcurrency <= 4` И `navigator.deviceMemory <= 2` (где доступно) → автоматически предложить отключить через одноразовый тост с кнопкой «Отключить анимации».
- Уважать `prefers-reduced-motion: reduce` — если выставлено системой, по умолчанию выключать.

**5. Применение в существующих компонентах**

Менять компоненты не требуется — глобальный CSS-killswitch перекрывает анимации. Но `motion`-обёртки из `framer-motion` (например, `CardAnimation.tsx` при покупке пака) — это полезные UX-анимации появления, их **НЕ** трогаем (они одноразовые, не зацикленные). Отключаем только зацикленные shimmer/diamond/glow.

### Файлы под изменение

- **Создать**: `src/hooks/useCardAnimationsSetting.ts`
- **Изменить**: `src/index.css` (правила `.no-card-animations`)
- **Изменить**: страница настроек (или меню) — добавить `Switch`
- **Изменить**: `src/main.tsx` или `App.tsx` — инициализация класса на `<html>` при загрузке + слушатель `prefers-reduced-motion`

### Что НЕ делаю

- Не убираю одноразовые `framer-motion` анимации открытия карт (они UX-критичны).
- Не трогаю серверную логику.
- Не меняю стили рамок редкости (border/glow остаются как индикатор), только зацикленные переливы.

### Проверка

- Открыть инвентарь → toggle OFF → shimmer на легендарных/мифических картах останавливается мгновенно, без перезагрузки.
- Перезагрузить страницу → состояние сохранилось.
- В DevTools Performance: при OFF — отсутствие постоянных layer/paint циклов от shimmer-карт.

