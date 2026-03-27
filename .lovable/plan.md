

# Fix: Crash when entering shelter after building upgrade completes

## Problem
When a player starts a building upgrade, leaves the shelter, and returns after the upgrade timer expires, the app crashes with the generic ErrorBoundary ("Что-то пошло не так" / "Сбросить бой"). The error boundary text mentions "battle reset" even though the issue is in the shelter — confusing for users.

## Root Cause Analysis
Two issues identified:

1. **Unhandled errors in `useBuildingUpgrades.ts`**: When the shelter loads with a completed upgrade, the `useEffect` (lines 75-95) detects `status !== 'ready'`, updates state, and calls `gameState.actions.batchUpdate()` **without `.catch()`**. If `batchUpdate` throws (e.g., wallet not yet connected, mutation in bad state), the unhandled rejection can cascade into a render crash. The same issue exists in the interval `useEffect` (lines 98-131).

2. **Crafting completion `useEffect` in `useShelterState.ts`** (lines 707-752): Similarly calls `addItemsToInstances` and `batchUpdate` without error handling, which can crash on mount.

3. **ErrorBoundary shows "Сбросить бой"** (reset battle) for all errors, even non-battle ones.

## Plan

### 1. Add error handling to `useBuildingUpgrades.ts`
- Wrap `batchUpdate` calls in both `useEffect` blocks with `.catch()` to prevent unhandled rejections
- Add defensive null checks before calling `gameState.actions.batchUpdate`

### 2. Add error handling to crafting completion in `useShelterState.ts`
- Wrap `addItemsToInstances` calls in try-catch
- Ensure the entire `checkCraftingCompletion` function has error handling

### 3. Update ErrorBoundary to be context-aware
- Change "Сбросить бой" to "Перезагрузить страницу" or make the button text generic
- Keep the battle reset functionality but with generic label since users see this in non-battle contexts

### 4. Add defensive rendering in Shelter page
- Wrap `ShelterUpgrades` rendering in error boundary or add null checks for critical data

## Technical Details

**`src/hooks/useBuildingUpgrades.ts`** — lines 90-94 and 123-127:
```ts
// Before:
gameState.actions.batchUpdate({ activeBuildingUpgrades: updated });

// After:
gameState.actions.batchUpdate({ activeBuildingUpgrades: updated })
  .catch(err => console.error('Failed to sync upgrade status:', err));
```

**`src/hooks/shelter/useShelterState.ts`** — lines 717-733:
Wrap `addItemsToInstances` in try-catch inside the crafting completion loop.

**`src/components/common/ErrorBoundary.tsx`** — line 61:
Change "Сбросить бой" to "Сбросить состояние" and make the description more generic.

