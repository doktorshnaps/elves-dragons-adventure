# Real-time Subscriptions Audit

## Overview
Audit of all Supabase real-time subscriptions in the codebase.
Last updated: 2026-01-20

## Subscription Coverage

### ✅ Tables with Real-time Subscriptions

| Table | Hook/Component | Events | Filter | Cache Invalidation |
|-------|---------------|--------|--------|-------------------|
| `game_data` | `GameDataContext.tsx` | UPDATE | `wallet_address=eq.X` | `gameData` |
| `game_data` | `useRealTimeSync.ts` | * | `wallet_address=eq.X` | callback |
| `card_instances` | `useCardInstances.ts` | INSERT, UPDATE, DELETE | `wallet_address=eq.X` | `cardInstances` |
| `card_instances` | `useRealTimeSync.ts` | * | `wallet_address=eq.X` | callback |
| `item_instances` | `useItemInstances.ts` | * | `wallet_address=eq.X` | `itemInstances` |
| `shop_inventory` | `useShopDataComplete.ts` | * | none (global) | `shopDataComplete` |
| `shop_inventory` | `useShopRealtime.ts` | UPDATE | none (global) | local state |
| `active_dungeon_sessions` | `useDungeonSync.ts` | * | `account_id=eq.X` | local state + Zustand |
| `active_dungeon_sessions` | `TeamBattlePage.tsx` | DELETE | `account_id=eq.X` | session terminated flag |
| `marketplace_listings` | `useRealTimeSync.ts` | * | none (global) | callback |
| `user_quest_progress` | `SocialQuests.tsx` | * | `wallet_address=eq.X` | refetch quests |
| `hero_base_stats` | `useGameSettings.ts`, `useNFTStatsRecalculation.ts` | UPDATE | none | reload settings |
| `dragon_base_stats` | `useGameSettings.ts`, `useNFTStatsRecalculation.ts` | UPDATE | none | reload settings |
| `rarity_multipliers` | `useGameSettings.ts`, `useNFTStatsRecalculation.ts` | UPDATE | none | reload settings |
| `class_multipliers` | `useGameSettings.ts`, `useNFTStatsRecalculation.ts` | UPDATE | none | reload settings |
| `dragon_class_multipliers` | `useGameSettings.ts` | UPDATE | none | reload settings |

### ✅ Recently Added Subscriptions

| Table | Hook/Component | Events | Filter | Cache Invalidation |
|-------|---------------|--------|--------|-------------------|
| `medical_bay` | `useMedicalBay.ts` | * | `wallet_address=eq.X` | `medicalBay`, `cardInstances` |
| `forge_bay` | `useForgeBay.ts` | * | `wallet_address=eq.X` | `forgeBay`, `cardInstances` |

### ⚠️ Tables Without Real-time (Potential Gaps)

| Table | Used By | Recommended Action |
|-------|---------|-------------------|
| `crafting_sessions` | crafting hooks | Add subscription for craft completion |
| `building_upgrades` | shelter hooks | Add subscription for upgrade completion |
| `profiles` | profile hooks | Low priority - rarely changes |

## Channel Naming Conventions

Current naming is inconsistent:
- `game-data-changes` ✅
- `card_instances_changes` ⚠️ (underscore vs hyphen)
- `item-instances-realtime` ⚠️ (different suffix)
- `shop-inventory-changes` ✅

**Recommendation**: Standardize to `{table-name}-changes` pattern.

## Duplicate Subscriptions

Some tables have multiple subscriptions:
1. `game_data`: GameDataContext + useRealTimeSync
2. `card_instances`: useCardInstances + useRealTimeSync
3. `shop_inventory`: useShopDataComplete + useShopRealtime

**Impact**: Duplicate websocket connections, redundant cache invalidations.

**Recommendation**: Consolidate into single provider-based subscription per table.

## Cleanup Verification

All subscriptions properly cleanup via:
```typescript
return () => {
  supabase.removeChannel(channel);
};
```

## Performance Considerations

1. **Filter usage**: Most user-specific tables correctly use `wallet_address` filter
2. **Event specificity**: Some use `*` when specific events would reduce traffic
3. **Debouncing**: No debouncing on rapid changes - consider for high-frequency tables

## Integration with invalidationPresets

Real-time subscriptions should use `invalidationPresets` for consistent cache management:

```typescript
// Before (direct invalidation)
queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });

// After (using presets)
import { invalidateByPreset } from '@/utils/invalidationPresets';
await invalidateByPreset(queryClient, accountId, 'afterBattle');
```

## Next Steps

1. [ ] Add missing subscriptions for medical_bay, forge_bay
2. [ ] Consolidate duplicate subscriptions
3. [ ] Standardize channel naming
4. [ ] Integrate invalidationPresets in all subscription handlers
