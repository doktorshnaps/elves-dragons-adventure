

# Fix: Golden Ticket check stuck in infinite loop

## Problem
Two bugs in `useGoldenTicketCheck` cause the NFT check to hang permanently showing "Проверка Golden Ticket...":

1. **Infinite refresh loop** -- `walletCandidates` is created as a new array on every render (`Array.from(new Set(...))`). Since it's a dependency of the `refreshAccess` `useCallback`, the callback is recreated each render. The `useEffect` on line 88 depends on `refreshAccess`, so it fires every render, calling the edge function in a tight loop (confirmed by edge function logs showing boot/shutdown every 1-2 seconds).

2. **`refreshingRef` doesn't trigger re-renders** -- `isChecking` is computed as `isLoading || refreshingRef.current`. When `refreshingRef.current` changes from `true` to `false`, no re-render occurs, so the UI stays stuck showing "Проверка..." even though the data is already in the DB (`has_access: true`).

## Solution
Two changes in `src/hooks/useGoldenTicketCheck.ts`:

1. **Memoize `walletCandidates`** with `useMemo` keyed on `accountId` and `nearAccountId` -- stops the infinite loop
2. **Replace `refreshingRef` with `useState`** -- ensures re-renders when the refresh completes, so `isChecking` updates properly

## Technical Details

**File**: `src/hooks/useGoldenTicketCheck.ts`

```typescript
// Before (broken):
const walletCandidates = Array.from(new Set([accountId, nearAccountId].filter(Boolean))) as string[];
const refreshingRef = useRef(false);

// After (fixed):
const walletCandidates = useMemo(
  () => Array.from(new Set([accountId, nearAccountId].filter(Boolean))) as string[],
  [accountId, nearAccountId]
);
const [isRefreshing, setIsRefreshing] = useState(false);
```

Update `refreshAccess` to use `setIsRefreshing(true/false)` instead of `refreshingRef.current`, and update `isChecking` to use `isRefreshing` state.

No database or edge function changes needed -- the edge function and DB data are working correctly.

