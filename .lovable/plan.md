
# Fix: Dungeon Entry with Empty Team Causes False Defeat

## Problem

When entering a dungeon without selecting any heroes for the team, the game allows you to see the pre-battle screen but the "Start Battle" button is (correctly) disabled. However, when you click "Back" to return to the dungeon list, the system incorrectly saves the empty state as an "active battle." Upon returning to the dungeon, it immediately shows the "Team fell / Defeat" screen even though no battle was fought.

### Root Cause

The function `handleSaveBattleStateAndNavigate` in `TeamBattlePage.tsx` unconditionally saves the current battle state (including an empty team) to Zustand and marks `activeBattleInProgress: true` -- even when:
- The battle has NOT started (`battleStarted = false`)
- The team is empty (`playerPairs = []`)

When the player re-enters the dungeon page, the component sees this saved state and sets `battleStarted = true`. Since there are zero alive pairs, `isBattleOver` evaluates to `true`, and the defeat screen renders immediately.

### Secondary Bug

There is also a `Maximum call stack size exceeded` error in `selector.ts` caused by infinite recursion between `window.open` (overridden) and `tg.openLink` (which internally calls `window.open`).

---

## Plan

### 1. Fix `handleSaveBattleStateAndNavigate` (primary fix)

**File:** `src/components/game/battle/TeamBattlePage.tsx`

Only save battle state when a battle is actually in progress. If no battle has started, simply navigate away without persisting anything.

```text
Before:
  handleSaveBattleStateAndNavigate always saves state and sets activeBattleInProgress = true

After:
  if (!battleStarted || battleState.playerPairs.length === 0) {
    // No battle in progress, just navigate
    navigate(targetRoute);
    return;
  }
  // Otherwise, save state as before
```

### 2. Add guard to `handleBackToMenu`

**File:** `src/components/game/battle/TeamBattlePage.tsx`

When the user clicks "Back" before the battle has started, use simple navigation instead of the battle-state-saving flow.

### 3. Add empty-team guard in defeat render logic

**File:** `src/components/game/battle/TeamBattlePage.tsx`

Add a safety check: if `playerPairs` has always been empty (i.e., no team was ever loaded), do NOT treat `alivePairs === 0` as a defeat. Instead, reset the stale state and show the pre-battle screen or redirect.

```text
At the isBattleOver render block (line ~811):
  if (isBattleOver && battleStarted && !showingFinishDelay) {
    // NEW: If team was never loaded, this is stale state, not a real defeat
    if (battleState.playerPairs.length === 0) {
      // Clear stale state and fall through to pre-battle screen
      setBattleStarted(false);
      useGameStore.getState().clearTeamBattleState();
      // Don't render defeat
    } else {
      // ... existing defeat/victory logic
    }
  }
```

### 4. Add empty-team validation in `proceedWithBattleStart`

**File:** `src/components/game/battle/TeamBattlePage.tsx`

Prevent starting a battle with zero player pairs:

```text
const proceedWithBattleStart = async () => {
  if (battleState.playerPairs.length === 0) {
    toast({ title: "No team selected", variant: "destructive" });
    return;
  }
  // ... existing logic
};
```

### 5. Fix infinite recursion in `selector.ts`

**File:** `src/utils/selector.ts`

Add a re-entry guard to prevent `window.open` -> `tg.openLink` -> `window.open` infinite loop:

```text
let isIntercepting = false;
window.open = function (url, target, features) {
  if (isIntercepting) return originalOpen.call(window, url, target, features);
  if (typeof url === 'string' && (isProviderUrl(url) || isTelegramDeepLink(url))) {
    isIntercepting = true;
    try {
      tg.openLink(redirectUrl);
    } finally {
      isIntercepting = false;
    }
    return null;
  }
  return originalOpen.call(window, url, target, features);
};
```

### 6. Fix auto-resume effect variable naming

**File:** `src/components/game/battle/TeamBattlePage.tsx` (line ~714)

The auto-resume effect checks `useGameStore.getState().battleState` (legacy) but names the variable `hasTeamBattleState`, which is confusing. Additionally, add a check for non-empty `playerPairs` before auto-resuming:

```text
useEffect(() => {
  const isActiveBattle = useGameStore.getState().activeBattleInProgress;
  const savedTeamState = useGameStore.getState().teamBattleState;
  
  if (isActiveBattle && savedTeamState?.playerPairs?.length > 0 && !battleStarted) {
    setBattleStarted(true);
  }
}, [battleStarted]);
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `TeamBattlePage.tsx` | Guard `handleSaveBattleStateAndNavigate` to skip saving when no battle is active |
| `TeamBattlePage.tsx` | Guard defeat screen rendering against empty team (stale state cleanup) |
| `TeamBattlePage.tsx` | Validate team is non-empty before starting battle |
| `TeamBattlePage.tsx` | Fix auto-resume effect to check `teamBattleState` with non-empty pairs |
| `selector.ts` | Add re-entry guard to prevent infinite recursion in `window.open` override |
