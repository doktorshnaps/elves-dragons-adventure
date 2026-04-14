

## Problem
After placing a card in medical bay, forge, or resurrection, the UI doesn't update until page reload. The hooks have comments "Кэш обновится автоматически через Real-time" but don't perform immediate cache invalidation after successful mutations.

## Fix
Add explicit `queryClient.invalidateQueries` calls after every successful RPC mutation in both `useMedicalBay.ts` and `useForgeBay.ts`. This provides instant UI feedback while Real-time serves as a backup sync.

### Changes in `src/hooks/useMedicalBay.ts`
After successful RPC in these functions, add immediate invalidation of `medicalBay`, `cardInstances`, and `gameData` queries:
- `placeCardInMedicalBay` (after line 236, replace the "Кэш обновится" comment)
- `resurrectCard` (after line 351)
- `removeCardFromMedicalBay` (after line 272)
- `stopHealingWithoutRecovery` (after line 299)
- `completeResurrection` (after line 396)

### Changes in `src/hooks/useForgeBay.ts`
Same pattern for:
- `placeCardInForgeBay` (after line 229)
- `removeCardFromForgeBay` (after line 260)
- `stopRepairWithoutRecovery` (after line 296)

### Invalidation pattern (same everywhere)
```typescript
queryClient.invalidateQueries({ queryKey: queryKeys.medicalBay(accountId) }); // or forgeBay
queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
queryClient.invalidateQueries({ queryKey: ['gameData'] });
```

