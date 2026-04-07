

# Fix: Rewards and Card State Not Updating After Dungeon Claim (Until Reload)

## Root Cause

Both `useCardInstances` and `useItemInstances` have aggressive cache settings that prevent updates:

```
staleTime: 30 * 60 * 1000  // 30 minutes
refetchOnMount: false
refetchOnWindowFocus: false
refetchOnReconnect: false
```

When `invalidateQueries` is called after claiming rewards, it marks queries as stale. But if no component is **currently observing** the query (e.g., user is still on the battle page, not on inventory/team page), the refetch doesn't happen. When the user then navigates to a page that uses these queries, `refetchOnMount: false` prevents fetching the fresh data — so stale cached data is shown until a full page reload.

## Fix

Two changes in each hook:

1. **`refetchOnMount: true`** (default behavior) — when a component mounts and the query is stale (which it will be after invalidation), React Query will refetch. This doesn't break the 30-min cache for normal navigation — it only refetches when the data has been explicitly invalidated.

2. **Use `refetchQueries` instead of `invalidateQueries`** in the claim flow — this forces an immediate network request regardless of whether any component is observing the query. This ensures data is fresh by the time the user sees the reward modal and navigates away.

## Files to Change

### `src/hooks/useCardInstances.ts` (line 72)
- Change `refetchOnMount: false` → `refetchOnMount: true`

### `src/hooks/useItemInstances.ts` (line 55)
- Change `refetchOnMount: false` → `refetchOnMount: true`

### `src/hooks/adventure/useDungeonRewards.ts` (lines 367-373)
- Change `invalidateQueries` → `refetchQueries` for `cardInstances` and `itemInstances` after successful claim
- Keep `invalidateQueries` for other keys (gameData, quests) as they're less critical

### `src/hooks/battle/useBattleRewards.ts` (lines 92-98)
- Same change: `invalidateQueries` → `refetchQueries` for `cardInstances` and `itemInstances`

