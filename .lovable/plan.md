

## Problem

The "Перезагрузить" button in `ErrorBoundary` calls `window.location.reload()`, which destroys all Zustand in-memory state — including `teamBattleState` (active battle). Since battle state is intentionally stored only in memory (not localStorage), a full page reload wipes it permanently.

The "Сбросить состояние" button also explicitly clears battle state before resetting the error.

**User's flow**: Start battle → go to menu → enter shelter → error → click "Перезагрузить" → page reloads → battle state gone.

## Solution

Change `ErrorBoundary.tsx` so that:

1. **"Перезагрузить"** → just resets the error boundary state (`hasError: false`) **without** clearing battle or reloading the page. This lets the user recover from the error and return to their battle.

2. **"Сбросить состояние"** → keeps its current behavior (clears battle state + resets error) as the "nuclear" option.

3. Rename buttons for clarity:
   - "Перезагрузить" → "Попробовать снова" (Try again — soft reset, preserves battle)
   - "Сбросить состояние" stays as-is (hard reset)

### File: `src/components/common/ErrorBoundary.tsx`

Replace the two buttons section:
- "Перезагрузить" button: change from `window.location.reload()` to `this.setState({ hasError: false })` and rename to "Попробовать снова"
- "Сбросить состояние" button: no change in behavior, keeps clearing battle + resetting error

