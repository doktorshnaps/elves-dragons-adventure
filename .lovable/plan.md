

## Problem Analysis

The team page shows all 5 heroes with dragons, but the dungeon pre-battle page shows only 2 with dragons. The root cause is in `useTeamBattle.ts` — the team initialization effect.

### Root Cause: Stale state guard prevents rebuild

In `src/hooks/team/useTeamBattle.ts`, the init effect (line 83-86) has this guard:

```text
if (battleState.playerPairs.length > 0) return; // Already initialized
```

Two scenarios cause desync:

1. **Zustand restoration**: `battleState` is initialized from Zustand saved state (line 25-46). If any previous battle for the same dungeon had modified dragons (died, removed), those stale `playerPairs` are restored — and the guard prevents rebuilding from the current team (`selectedPairs`).

2. **Race condition**: If `selectedPairs` loads with incomplete dragon data first (e.g., `useCards` finishes and the medical bay filter removes some dragons temporarily), the effect builds playerPairs once. When `selectedPairs` later updates with correct data, the guard blocks the rebuild.

### Why team page is correct
The team page reads `selectedPairs` directly (always current from `player_teams` DB). The dungeon page reads `battleState.playerPairs` which is a one-time snapshot that may be stale.

---

## Fix Plan

### File: `src/hooks/team/useTeamBattle.ts`

**Change 1: Only restore playerPairs from Zustand if battle is actually active** (lines 25-58)

Add check for `activeBattleInProgress` when restoring from Zustand. If no active battle, start with empty `playerPairs` so the init effect can build from current `selectedPairs`.

```typescript
const savedBattleState = useGameStore.getState().teamBattleState;
const isMatchingDungeon = savedBattleState?.dungeonType === dungeonType;
const isActiveBattle = useGameStore.getState().activeBattleInProgress;

if (isMatchingDungeon && savedBattleState && isActiveBattle) {
  // Restore full state only during active battle
  return { playerPairs: savedBattleState.playerPairs || [], ... };
}
return { playerPairs: [], ... }; // Fresh start
```

**Change 2: Rebuild playerPairs when selectedPairs changes (pre-battle only)** (lines 83-86)

Replace the simple guard with a smarter check: skip rebuild only during active battle (opponents generated). Otherwise, always rebuild from current `selectedPairs`.

```typescript
useEffect(() => {
  if (cardInstancesLoading) return;
  if (selectedPairs.length === 0) return;
  
  // Only skip rebuild during active battle (opponents already generated)
  const isActiveBattle = useGameStore.getState().activeBattleInProgress;
  if (isActiveBattle && battleState.opponents.length > 0) return;
  
  // Build/rebuild playerPairs from current selectedPairs
  const teamPairs: TeamPair[] = selectedPairs.map((pair, index) => {
    // ... existing build logic ...
  });
  // ... existing setState logic ...
}, [selectedPairs, cardInstancesLoading, cardInstances, dungeonType]);
```

This ensures:
- Pre-battle screen always shows the current team from `player_teams` DB
- Active battles are not disrupted by team changes
- No stale Zustand data pollutes the pre-battle display

