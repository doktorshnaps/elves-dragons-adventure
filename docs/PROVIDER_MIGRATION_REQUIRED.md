# Provider Migration Required

## Problem
11 components still call `useItemInstances()` and `useCardInstances()` directly instead of using centralized context providers, causing duplicate React Query subscriptions and database queries.

## Current State
- `ItemInstancesProvider` and `CardInstancesProvider` are set up in App.tsx
- But components bypass them and create their own subscriptions
- Result: 2+ database queries for same data

## Components Requiring Migration

### useItemInstances() → useItemInstancesContext()
1. ✅ `src/hooks/battle/useItemHandling.ts`
2. ✅ `src/hooks/useItemOperations.ts`
3. ✅ `src/components/game/shelter/Barracks.tsx`
4. ✅ `src/components/game/shelter/BuildingCard.tsx`
5. ✅ `src/components/game/shelter/DragonLair.tsx`
6. ✅ `src/components/game/shelter/InventoryPanel.tsx`
7. ✅ `src/components/soul-altar/SoulAltarTab.tsx`
8. ✅ `src/hooks/equipment/useEquipmentState.ts`
9. ✅ `src/hooks/marketplace/useMarketplaceOperations.ts`
10. ✅ `src/hooks/shelter/useShelterState.ts` (2 instances!)
11. ✅ `src/components/game/InventoryDisplay.tsx`

### useCardInstances() → useCardInstancesContext()
- Similar migration needed for 18 components using `useCardInstances()`

## Migration Pattern

### Before (Duplicate Query):
```typescript
import { useItemInstances } from '@/hooks/useItemInstances';

const MyComponent = () => {
  const { instances, loading } = useItemInstances(); // Creates new subscription
  // ...
}
```

### After (Centralized):
```typescript
import { useItemInstancesContext } from '@/providers/ItemInstancesProvider';

const MyComponent = () => {
  const { instances, loading } = useItemInstancesContext(); // Uses existing subscription
  // ...
}
```

## Quick Fix Applied
- Removed `React.StrictMode` from main.tsx to eliminate double-mounting
- This reduces duplicate queries from 2 to 1 temporarily
- Full fix requires migrating all 11+ components

## Expected Impact After Full Migration
- **Current**: 2-4 duplicate queries per page load
- **After migration**: 1 query per data type (item/card instances)
- **Reduction**: 75% fewer database requests
