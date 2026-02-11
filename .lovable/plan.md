
# Fix: Building Upgrade Lost on Page Navigation

## Root Cause

The upgrade data is saved to the database but the React Query cache is never updated with the new data. Here's exactly what happens:

```text
1. User clicks "Build" on Clan Hall
2. startUpgradeAtomic() fires:
   - Sets local state (shows timer in UI) 
   - Calls batchUpdate() -> writes to Supabase DB (via throttler)
3. User navigates away from Shelter
4. useBuildingUpgrades unmounts, local state is lost
5. User navigates back to Shelter
6. useBuildingUpgrades remounts with activeUpgrades = []
7. useEffect reads gameData.activeBuildingUpgrades from GameDataContext
8. GameDataContext has staleTime: 30 MINUTES + refetchOnMount: false
   -> It still serves the OLD cached data (from before the upgrade)
   -> activeBuildingUpgrades = [] (stale)
9. No upgrade shown. User has to press again.
```

The Real-time subscription DOES fire `invalidateQueries`, but `refetchOnMount: false` prevents the stale query from being refetched when the component mounts again.

Other buildings work because users typically stay on the Shelter page while they upgrade. The bug manifests when navigating away and back.

## Solution

Update `useBuildingUpgrades` to **optimistically update the React Query cache** after saving to the database. This is the same pattern already used by `GameDataContext.updateGameData()` (line 324) but currently NOT used by `batchUpdate()`.

### File: `src/hooks/useBuildingUpgrades.ts`

**Change 1**: Import `useQueryClient` and get `accountId`

Add imports for `useQueryClient` from `@tanstack/react-query` and `useWalletContext` from WalletConnectContext. Get `queryClient` and `accountId` in the hook body.

**Change 2**: After every successful `batchUpdate` that modifies `activeBuildingUpgrades`, also update the React Query cache:

```typescript
// Helper to sync cache
const syncToCache = (upgrades: UpgradeProgress[], extraUpdates?: Record<string, any>) => {
  queryClient.setQueryData(['gameData', accountId], (old: any) => {
    if (!old) return old;
    return {
      ...old,
      activeBuildingUpgrades: upgrades,
      ...extraUpdates
    };
  });
};
```

Apply this in 4 places:
- `startUpgradeAtomic` (after batchUpdate succeeds) -- sync new upgrade list
- `installUpgrade` (after batchUpdate succeeds) -- sync cleared upgrade list + new buildingLevels
- Completion check effect (line 53-56) -- sync status change to "ready"
- Interval completion check (line 80-83) -- sync status change to "ready"

**Change 3**: Fix the loading guard in the initial load effect (line 21-27)

The current code uses `||` operator:
```typescript
const upgrades = gameData.activeBuildingUpgrades || gameState.activeBuildingUpgrades;
```

Since `[]` is truthy, `gameData.activeBuildingUpgrades` (default `[]`) always wins over `gameState.activeBuildingUpgrades` even when gameState has real data. Fix to check array length:

```typescript
const upgrades = (gameData.activeBuildingUpgrades?.length > 0)
  ? gameData.activeBuildingUpgrades 
  : gameState.activeBuildingUpgrades;
```

### Summary of changes

| Change | Location | Impact |
|--------|----------|--------|
| Add queryClient + accountId | Hook imports/body | Access to React Query cache |
| Cache sync helper | New function in hook | Reusable cache updater |
| Sync after startUpgradeAtomic | Line ~230 | Upgrade persists in cache across navigation |
| Sync after installUpgrade | Line ~149 | Level change visible immediately |
| Sync after completion checks | Lines ~53, ~80 | "Ready" status persists in cache |
| Fix `\|\|` operator for loading | Line ~22 | Correct fallback when gameData has empty default |

This is the minimal fix: 1 file changed, no architectural changes, follows the existing `queryClient.setQueryData` pattern already used in `GameDataContext.updateGameData`.
