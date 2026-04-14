

## Problem Analysis

The monster kill counter has two bugs in quick battle mode:

### Bug 1: Level 1 shows 0 kills
The kill-detection `useEffect` (line 820) initializes `prevOpponentsRef` only when `!battleStarted`. But opponents are generated at the same time `battleStarted` becomes `true`, so `prevOpponentsRef` never captures the initial opponents. When quick battle kills them, the detection has no "before" snapshot to compare against — resulting in 0 detected kills.

### Bug 2: Levels 2+ show double the expected kills
`handleQuickBattle` (lines 435-440) explicitly adds kills to `monstersKilledRef` and `setMonstersKilled`. Then, when `setBattleState` updates opponents to dead, the kill-detection `useEffect` (line 820) fires and detects the same kills again — doubling the count.

**User's numbers confirm this:**
- Expected cumulative: 1, 3, 6, 10
- Double of expected: 2, 6, 12, 20
- Actual shown: 0, 6, 12, 20 (level 1 is 0 due to Bug 1, rest are doubled due to Bug 2)

---

## Fix Plan

### File: `src/components/game/battle/TeamBattlePage.tsx`

**Change 1: Remove duplicate kill tracking from `handleQuickBattle`** (lines 434-441)

Remove the manual kill addition block (`monstersKilledRef.current = ...` and `setMonstersKilled`). Let the existing kill-detection `useEffect` handle all counting — this eliminates the double-counting.

**Change 2: Fix `prevOpponentsRef` initialization in kill-detection `useEffect`** (around line 820)

The effect currently only initializes `prevOpponentsRef` when `!battleStarted`. Add logic so that when `battleStarted` is true and `prevOpponentsRef.current` is empty (or has different opponents than current), it initializes the ref with the current alive opponents before checking for kills. This ensures level 1 has a proper "before" snapshot.

Specifically:
```typescript
// After the !battleStarted early return, add:
if (prevOpponentsRef.current.length === 0 && aliveOpponents.length > 0) {
  prevOpponentsRef.current = aliveOpponents.map(opp => ({
    id: opp.id, name: opp.name, health: opp.health
  }));
  prevAliveOpponentsRef.current = aliveOpponents.length;
  return; // First snapshot — don't detect kills yet
}
```

These two changes together ensure:
- Kills are counted exactly once (by the kill-detection effect only)
- Level 1 properly initializes the opponent snapshot before detecting kills
- Cumulative counts across levels remain correct

