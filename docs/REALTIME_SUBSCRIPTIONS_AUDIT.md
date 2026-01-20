# Real-time Subscriptions Audit

## Overview
Audit of all Supabase real-time subscriptions in the codebase.
Last updated: 2026-01-20

## Subscription Coverage

### ✅ Tables with Real-time Subscriptions (Consolidated)

| Table | Hook/Component | Events | Filter | Cache Invalidation |
|-------|---------------|--------|--------|-------------------|
| `game_data` | `GameDataContext.tsx` | UPDATE | `wallet_address=eq.X` | React Query setQueryData |
| `card_instances` | `useCardInstances.ts` | INSERT, UPDATE, DELETE | `wallet_address=eq.X` | `cardInstances` |
| `item_instances` | `useItemInstances.ts` | * | `wallet_address=eq.X` | `itemInstances` |
| `shop_inventory` | `useShopDataComplete.ts` | * | none (global) | `shopDataComplete` |
| `shop_inventory` | `useShopRealtime.ts` | UPDATE | none (global) | local state |
| `active_dungeon_sessions` | `useDungeonSync.ts` | * | `account_id=eq.X` | local state + Zustand |
| `active_dungeon_sessions` | `TeamBattlePage.tsx` | DELETE | `account_id=eq.X` | session terminated flag |
| `marketplace_listings` | `useRealTimeSync.ts` | * | none (global) | callback |
| `user_quest_progress` | `SocialQuests.tsx` | * | `wallet_address=eq.X` | refetch quests |
| `hero_base_stats` | `useGameSettings.ts` | UPDATE | none | reload settings |
| `dragon_base_stats` | `useGameSettings.ts` | UPDATE | none | reload settings |
| `rarity_multipliers` | `useGameSettings.ts` | UPDATE | none | reload settings |
| `class_multipliers` | `useGameSettings.ts` | UPDATE | none | reload settings |
| `dragon_class_multipliers` | `useGameSettings.ts` | UPDATE | none | reload settings |
| `medical_bay` | `useMedicalBay.ts` | * | `wallet_address=eq.X` | `medicalBay`, `cardInstances` |
| `forge_bay` | `useForgeBay.ts` | * | `wallet_address=eq.X` | `forgeBay`, `cardInstances` |

### ✅ Duplicate Subscriptions REMOVED (Phase 5.1)

The following subscriptions were removed from `useRealTimeSync.ts` to prevent duplication:
- `game_data` → now only in `GameDataContext.tsx`
- `card_instances` → now only in `useCardInstances.ts`
- `shop_inventory` → now only in `useShopRealtime.ts`

### ⚠️ Tables Without Real-time (Potential Improvements)

| Table | Recommended Action |
|-------|-------------------|
| `crafting_sessions` | Add subscription for craft completion |
| `profiles` | Low priority - rarely changes |

## Channel Naming Conventions

| Current | Standardized | Status |
|---------|-------------|--------|
| `game-data-changes` | `game-data-changes` | ✅ |
| `card-instances-changes` | `card-instances-changes` | ✅ |
| `item-instances-realtime` | `item-instances-changes` | ⚠️ TODO |
| `shop-inventory-changes` | `shop-inventory-changes` | ✅ |
| `marketplace-changes` | `marketplace-changes` | ✅ |
| `medical-bay-changes` | `medical-bay-changes` | ✅ |
| `forge-bay-changes` | `forge-bay-changes` | ✅ |

## Integration with invalidationPresets

All Real-time subscriptions should use centralized invalidation presets:

```typescript
import { invalidateByPreset } from '@/utils/invalidationPresets';

// In Real-time callback
const channel = supabase
  .channel('medical-bay-changes')
  .on('postgres_changes', { ... }, async (payload) => {
    await invalidateByPreset(queryClient, accountId, 'afterMedicalBay');
  })
  .subscribe();
```

## Completed Tasks Checklist

- [x] Remove duplicate subscriptions from `useRealTimeSync.ts`
- [x] Add Real-time subscription to `useMedicalBay.ts`
- [x] Add Real-time subscription to `useForgeBay.ts`
- [x] Update `RealTimeSyncOptions` interface
- [x] Update `useUnifiedGameState.ts` to work with new API

## Next Steps

1. Standardize channel name in `useItemInstances.ts` (`item-instances-realtime` → `item-instances-changes`)
2. Add subscription for `crafting_sessions` if real-time craft updates are needed
3. Integrate `invalidationPresets` in all Real-time handlers
