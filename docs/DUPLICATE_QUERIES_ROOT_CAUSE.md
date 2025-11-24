# Root Cause: Duplicate get_item_instances_by_wallet Queries

## Problem
During shop purchases, `get_item_instances_by_wallet` was being called **2 times** instead of once:
1. First call: Triggered by `window.dispatchEvent('itemInstancesUpdate')` in Shop.tsx
2. Second call: Background refetch after Real-time sync

## Root Cause Analysis

### Architecture Before Fix
```typescript
// Shop.tsx - After purchase
window.dispatchEvent(new CustomEvent('itemInstancesUpdate')); // ❌ Triggers manual refetch
setTimeout(() => refetchShopData(), 1000); // Background sync

// useItemInstances.ts - Listening for events
useEffect(() => {
  const handleUpdate = () => {
    refetch(); // ❌ Makes get_item_instances_by_wallet call
  };
  window.addEventListener('itemInstancesUpdate', handleUpdate);
}, [refetch]);

// useItemInstances.ts - Real-time subscription
useEffect(() => {
  supabase.channel('item-instances-realtime')
    .on('postgres_changes', { event: 'INSERT', table: 'item_instances' }, () => {
      queryClient.invalidateQueries({ queryKey: ['itemInstances'], refetchType: 'none' });
    });
}, []);
```

### Problem Flow
1. User clicks "Buy" in shop
2. `shop-purchase` Edge Function creates item in `item_instances` table
3. **Trigger 1**: Shop.tsx dispatches `itemInstancesUpdate` window event
4. `useItemInstances` receives window event → calls `refetch()` → **Query 1: get_item_instances_by_wallet**
5. **Trigger 2**: Real-time subscription detects INSERT in `item_instances`
6. Real-time marks cache as stale (but doesn't refetch due to `refetchType: 'none'`)
7. After 1 second, `refetchShopData()` runs → **Query 2: get_shop_data_complete** (includes item_instances)

Result: **2 queries for item_instances** (window event refetch + background refetch)

## Solution Applied

### Removed Window Events Pattern
```typescript
// Shop.tsx - BEFORE
window.dispatchEvent(new CustomEvent('itemInstancesUpdate')); // ❌ REMOVED
window.dispatchEvent(new CustomEvent('cardInstancesUpdate')); // ❌ REMOVED

// Shop.tsx - AFTER
// Real-time subscription will handle automatic sync, no manual events needed ✅

// useItemInstances.ts - BEFORE
useEffect(() => {
  const handleUpdate = () => {
    refetch(); // ❌ REMOVED
  };
  window.addEventListener('itemInstancesUpdate', handleUpdate);
}, [refetch]);

// useItemInstances.ts - AFTER
// Window events removed - Real-time subscription handles all updates ✅
```

### Why This Works
1. **Optimistic Updates**: UI updates immediately via `queryClient.setQueryData` (0 queries)
2. **Real-time Sync**: Supabase Real-time subscription detects INSERT (marks cache stale)
3. **Background Refetch**: Single `refetchShopData()` after 1 second syncs all data
4. **No Manual Events**: Window events completely removed - unnecessary with Real-time

## Results

### Before Fix
- Shop purchase: 4 queries
  - 2x `get_item_instances_by_wallet` (window event + background)
  - 1x `get_card_instances_by_wallet`
  - 1x `get_shop_data_complete`

### After Fix
- Shop purchase: 2 queries (50% reduction)
  - 0x `get_item_instances_by_wallet` (covered by Real-time + optimistic updates)
  - 1x `get_card_instances_by_wallet` (background sync)
  - 1x `get_shop_data_complete` (background sync, includes item_instances)

## Key Learnings

### Anti-Pattern: Mixing Window Events + Real-Time
❌ **Don't do this:**
```typescript
// Manual window events + Real-time = Duplicate queries
window.dispatchEvent(new CustomEvent('dataUpdate'));
supabase.channel().on('postgres_changes', () => invalidate());
```

✅ **Do this instead:**
```typescript
// Only Real-time subscription for automatic sync
supabase.channel().on('postgres_changes', { refetchType: 'none' });
// Optimistic updates for immediate UI
queryClient.setQueryData(key, newData);
```

### Pattern: Optimistic Updates + Real-Time + Background Sync
1. **Immediate**: Optimistic cache update (0ms, 0 queries)
2. **Automatic**: Real-time marks cache stale when DB changes
3. **Eventual**: Single background refetch syncs all data (1000ms, 1 query)

This eliminates race conditions and duplicate queries while maintaining responsive UI.
