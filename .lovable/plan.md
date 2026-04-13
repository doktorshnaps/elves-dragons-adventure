

## Диагностика и план исправления трёх проблем

### Проблема 1: Изображения карточек не отображаются при переходе между уровнями

**Причина**: Компонент `OptimizedImage` использует `opacity: 0` при загрузке (`!isLoaded && !hasError`). При переходе на новый уровень компонент `TeamBattleArena` ре-рендерится, и `OptimizedImage` сбрасывает `isLoaded` в `false`, карточки становятся невидимыми до повторной загрузки изображений. Хотя изображения уже в кэше браузера, `onLoad` может не сработать быстро, создавая заметную задержку.

**Исправление**: В `OptimizedImage` — если `src` не меняется при ре-рендере, не сбрасывать `isLoaded`. Также для карточек в бою ставить `priority={true}` для `eager` загрузки вместо `lazy`.

### Проблема 2: Ошибка `duplicate key value violates unique constraint "idx_medical_bay_active_card"`

**Причина**: Race condition — фронтенд проверяет `is_in_medical_bay` и `medical_bay` таблицу, но между проверкой и вставкой другой запрос (или двойной клик) успевает вставить запись. RPC `add_card_to_medical_bay` тоже проверяет через `IF EXISTS`, но без `SELECT FOR UPDATE` — это не атомарно. Вставка падает на unique index.

**Исправление**:
1. В RPC `add_card_to_medical_bay` — добавить `SELECT FOR UPDATE` на `card_instances` для блокировки и использовать `INSERT ... ON CONFLICT (card_instance_id) WHERE is_completed = false DO NOTHING` вместо простого `INSERT`. Если вставка не произошла — вернуть существующий ID.
2. На фронтенде — добавить debounce/disable кнопки после первого нажатия.

### Проблема 3: Карта ставится на лечение без назначенных рабочих

**Причина**: Текущий код в `useMedicalBay.ts` (строки 148-157) только показывает toast-уведомление если рабочих нет, но **не блокирует** постановку карты на лечение. Карта всё равно отправляется в медпункт.

**Исправление**: Заблокировать постановку на лечение если нет рабочих — показать ошибку и сделать `return` вместо продолжения выполнения. Также проверять рабочих на стороне сервера (опционально).

---

### Файлы для изменения

1. **`src/components/ui/optimized-image.tsx`** — не сбрасывать `isLoaded` при ре-рендере если `src` не менялся; для боевого контекста использовать `priority={true}`

2. **`src/components/game/battle/TeamBattleArena.tsx`** — передавать `priority={true}` или заменить `<img>` на `<OptimizedImage>` с `priority` для карточек игрока

3. **Новая миграция SQL** — пересоздать `add_card_to_medical_bay` с `SELECT ... FOR UPDATE` на card_instances и `INSERT ... ON CONFLICT DO NOTHING` для атомарности

4. **`src/hooks/useMedicalBay.ts`** — изменить проверку рабочих: блокировать лечение если рабочих нет (return после toast с ошибкой), добавить флаг `isSubmitting` для предотвращения двойных кликов

5. **`src/components/game/medical/MedicalBayComponent.tsx`** — disable кнопки "Отправить на лечение" если нет рабочих в медпункте

