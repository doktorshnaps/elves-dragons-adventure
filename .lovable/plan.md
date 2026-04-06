

# Fix: Battle State Lost on Page Reload

## Problem

Zustand `gameStore` has NO persistence. On page reload, `teamBattleState` is `null`, so the battle restarts from level 1. The save/restore logic only works for in-app navigation (clicking "Back to menu"), not for browser refresh.

## Solution

Add `zustand/middleware` persist for battle-related fields only. This saves `teamBattleState`, `activeBattleInProgress`, and `selectedTeam` to `localStorage` automatically, so they survive page reloads.

## Changes

### 1. `src/stores/gameStore.ts` — Add persist middleware

- Import `persist` from `zustand/middleware`
- Wrap the store with `persist()`, persisting only battle-related keys:
  - `teamBattleState`
  - `activeBattleInProgress`  
  - `selectedTeam`
- Use storage name `'game-battle-state'`
- Use `partialize` to exclude non-battle fields (balance, accountLevel, etc. come from Supabase and should NOT be persisted locally)

### 2. `src/components/game/battle/TeamBattlePage.tsx` — Add beforeunload save

- Add a `beforeunload` event listener that saves the current battle state to Zustand before the page unloads (ensures the latest state is captured even mid-battle, not just when navigating via buttons)
- This complements the persist middleware by ensuring the state is written synchronously before the tab closes

### 3. `src/hooks/useDungeonSync.ts` — Protect against stale persisted state

- In the DELETE handler and session validity check, also clear the persisted localStorage key `'game-battle-state'` when wiping battle state, to prevent stale restored battles after session expiry

## Technical Detail

```typescript
// gameStore.ts — key change
import { persist } from 'zustand/middleware';

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ... existing store code unchanged
    }),
    {
      name: 'game-battle-state',
      partialize: (state) => ({
        teamBattleState: state.teamBattleState,
        activeBattleInProgress: state.activeBattleInProgress,
        selectedTeam: state.selectedTeam,
      }),
    }
  )
);
```

## Files

- `src/stores/gameStore.ts` — persist middleware
- `src/components/game/battle/TeamBattlePage.tsx` — beforeunload handler
- `src/hooks/useDungeonSync.ts` — clear persisted storage on session end

