

## Fix: Soul Crystal Donation Duplication

### Root Cause
Every donation creates **exactly 2 rows** with sub-millisecond timestamps (e.g., `21:34:00.594075` and `21:34:00.594364`). The `donating` state flag uses `useState`, which is asynchronous — if the click handler fires twice before React re-renders (double-click, touch event doubling), both calls pass the `donating === false` check and execute the RPC simultaneously.

### Fix (2 layers)

#### 1. Frontend: `useRef` lock in `SoulAltarTab.tsx`
Add a `useRef(false)` lock that synchronously blocks duplicate calls:
```typescript
const donatingRef = useRef(false);

const handleDonate = async () => {
  if (donatingRef.current) return; // synchronous guard
  donatingRef.current = true;
  // ... existing logic ...
  donatingRef.current = false; // in finally block
};
```

#### 2. Database: Row-level lock in `donate_soul_crystals`
Add `FOR UPDATE` on the crystal rows to serialize concurrent calls, and add a deduplication check:
- Lock the `item_instances` rows with `FOR UPDATE SKIP LOCKED`
- This ensures that if two identical calls arrive simultaneously, the second one gets fewer rows and fails the count check

### Files
1. **`src/components/soul-altar/SoulAltarTab.tsx`** — Add `useRef` synchronous lock
2. **New SQL migration** — Recreate `donate_soul_crystals` with `FOR UPDATE` locking on the crystal selection query

