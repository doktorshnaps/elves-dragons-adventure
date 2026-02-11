
# Fix: Hero Addition Error Due to Cleanup Race Condition

## Root Cause Analysis

The bug is a **race condition** between adding a hero and the cleanup effect in `useTeamSelection.ts`.

### What happens step by step:

```text
1. User clicks "Add Hero"
2. handlePairSelect() runs:
   - Reads current dungeonTeam
   - Appends new hero
   - Calls updateTeam() -> RPC succeeds, local state updates
   - dungeonTeam recalculates with new hero

3. Cleanup useEffect fires (triggered by dungeonTeam change)
   - Builds validIds from cards array
   - BUT if cards is still loading or temporarily empty
     (cardInstances query refetching), validIds = empty Set
   - ALL heroes fail the validIds.has() check
   - Cleanup REMOVES the just-added hero as "non-existing"
   - Calls updateTeam() again with empty/reduced team

4. User sees error or empty team
5. Navigating away and back -> cards loads properly -> hero is visible from DB
```

### The critical missing guard (line 90-170 of useTeamSelection.ts):

The cleanup `useEffect` has NO check for whether `cards` has finished loading. When `cardInstances` is refetching (e.g., after a mutation or Real-time event), `cards` can temporarily be an empty array, causing `validIds` to be empty and wiping the entire team.

### Secondary issue:

The `selectedTeamWithHealth` useMemo (line 68) still has `gameData.selectedTeam` in its dependency array despite comments saying it's not used -- this causes unnecessary re-renders.

---

## Fix Plan

### File: `src/hooks/team/useTeamSelection.ts`

**Fix 1: Add loading guard to cleanup useEffect (CRITICAL)**

Add `cardsLoading` check at the top of the cleanup effect. If cards haven't loaded yet, skip cleanup entirely -- we cannot determine which cards are valid without data.

```typescript
// Line 90 - add guard
useEffect(() => {
  // CRITICAL: Don't cleanup while cards are still loading
  // Empty cards array would incorrectly remove all team members
  if (cardsLoading) return;
  
  const baseTeam = dungeonTeam as TeamPair[];
  if (!baseTeam || baseTeam.length === 0) return;
  // ... rest of cleanup logic
```

**Fix 2: Remove stale dependency from selectedTeamWithHealth**

Line 68: Remove `gameData.selectedTeam` from the useMemo dependency array since it's explicitly not used anymore (per architecture memory).

```typescript
// Line 68 - change from:
}, [dungeonTeam, gameData.selectedTeam, cardsMap]);
// to:
}, [dungeonTeam, cardsMap]);
```

**Fix 3: Add error feedback in handlePairSelect catch block**

Currently the catch block (line 246-248) only does `console.error` but never fires because `updateTeam` catches internally. Add a toast for the case where `updateTeam` returns `false`:

```typescript
try {
  const success = await updateTeam('dungeon', null, newPairs);
  if (!success) {
    toast({
      title: "Ошибка",
      description: "Не удалось добавить героя в команду. Попробуйте ещё раз.",
      variant: "destructive"
    });
    return;
  }
  
  const { setSelectedTeam } = useGameStore.getState();
  setSelectedTeam(newPairs);
} catch (error) {
  console.error('Failed to add hero to team:', error);
  toast({
    title: "Ошибка",
    description: "Не удалось добавить героя в команду",
    variant: "destructive"
  });
}
```

### Summary of changes:

| Change | File | Lines | Impact |
|--------|------|-------|--------|
| Add `cardsLoading` guard to cleanup | useTeamSelection.ts | ~90 | Prevents race condition -- the core fix |
| Remove stale dependency | useTeamSelection.ts | 68 | Eliminates unnecessary re-renders |
| Add error toast on updateTeam failure | useTeamSelection.ts | 239-248 | Better user feedback |

These are minimal, targeted changes that fix the race condition without altering any existing game logic or data flow.
