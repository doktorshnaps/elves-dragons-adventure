

## Problem Analysis

The Level 1 quick battle still shows 0 kills because of a race condition in the snapshot initialization. Here's the exact sequence:

1. `setBattleStarted(true)` is called
2. `useTeamBattle` generates opponents **asynchronously**
3. The kill-detection `useEffect` fires multiple times during opponent loading — with `prevOpponentsRef = []` and `aliveOpponents = []`
4. Eventually opponents load → effect fires → `prevOpponentsRef = []`, `aliveOpponents > 0` → **initializes snapshot, returns**
5. User clicks Quick Battle → 1.5s → opponents set to dead
6. Effect should detect kills, BUT there's a timing gap where the snapshot may not be ready

The fix at line 828 relies on the effect firing *between* opponent generation and quick battle execution. But if the user clicks Quick Battle immediately when the button appears, the effect may not have run yet to take the snapshot.

## Fix

### File: `src/components/game/battle/TeamBattlePage.tsx`

**Single change in `handleQuickBattle`** (around line 434):

Before the setTimeout, force-initialize `prevOpponentsRef` with the current alive opponents. This guarantees the "before" snapshot exists regardless of whether the useEffect has run:

```typescript
// Force-initialize snapshot for kill detection (fixes Level 1 = 0 kills)
const currentAlive = battleState.opponents.filter(o => o.health > 0);
if (prevOpponentsRef.current.length === 0 && currentAlive.length > 0) {
  prevOpponentsRef.current = currentAlive.map(opp => ({
    id: opp.id, name: opp.name, health: opp.health
  }));
  prevAliveOpponentsRef.current = currentAlive.length;
}
```

This is safe because:
- It only runs when the snapshot is empty (won't interfere with normal battles)
- The kill-detection effect will still do the actual counting when state updates
- No double-counting since we're not adding kills here, just ensuring the snapshot exists

