

# Fix: Dungeon Reward Claim Losing Progress

## Problem Analysis

Players lose all dungeon progress (rewards, card damage, items) when pressing "Забрать и выйти" after many levels. The error "Не удалось сохранить состояние карт" appears.

**Root Cause**: The `currentClaimKey` is being cleared BEFORE the player claims rewards, causing the code to enter the wrong path (defeat/surrender path instead of reward claim path). Three sources of premature clearing:

1. **Realtime DELETE listener** (`useDungeonSync.ts:301-314`): When the dungeon session row is deleted from DB (by timeout, heartbeat miss, or concurrent tab), the listener immediately wipes `currentClaimKey` from state and localStorage, even if a claim is in progress.
2. **Session validity check** (`useDungeonSync.ts:83-103`): Periodically checks if the device's session exists in DB. If the session expires or gets cleaned, it wipes `currentClaimKey`.
3. **`endDungeonSession`** (`useDungeonSync.ts:131-135`): Wipes `currentClaimKey` before even calling the edge function.

When `getCurrentClaimKey()` returns `null`, the code at `useDungeonRewards.ts:196` sets `shouldSkipRewards = true`, entering the defeat-only path. This path tries `batch_update_card_stats` which may also fail, resulting in total loss of progress.

## Solution

### 1. Protect claimKey from premature clearing (useDungeonSync.ts)

- Add a `claimInProgressRef` flag that prevents ANY cleanup path from clearing `currentClaimKey` while a claim is active.
- Export `setClaimInProgress(true/false)` for the battle page to call before/after claiming.
- In the Realtime DELETE handler, session validity check, and `endDungeonSession`: skip clearing `currentClaimKey` if `claimInProgressRef.current === true`.

### 2. Save claimKey independently (TeamBattlePage.tsx)

- In `handleClaimAndExit`, capture the claimKey at the very start and store it in a local `useRef` as backup. Even if external cleanup fires, the local copy survives.
- Pass this captured key to `claimRewardAndExit` instead of calling `getCurrentClaimKey()` which may return null after race.

### 3. Improve error handling in batch_update_card_stats path (useDungeonRewards.ts)

- Log the actual `batchError` details (code, message) for debugging.
- Make the card-save failure non-blocking: show warning but still return `success: true` so the player can exit. Cards will heal naturally or via other mechanisms.
- Add retry logic (1 retry) for `batch_update_card_stats` on failure.

### 4. Don't clear claimKey in endDungeonSession (useDungeonSync.ts)

- Move `localStorage.removeItem('currentClaimKey')` out of `endDungeonSession`. The claim key should only be cleared after a successful claim (already done in `useDungeonRewards.ts:352`) or in `handleExitAndReset` (already done at line 317).

## Files to Modify

- `src/hooks/useDungeonSync.ts` — Add claim-in-progress guard, remove premature claimKey clearing
- `src/components/game/battle/TeamBattlePage.tsx` — Capture claimKey early in ref, set claim-in-progress flag
- `src/hooks/adventure/useDungeonRewards.ts` — Improve error logging, make card-save non-blocking

