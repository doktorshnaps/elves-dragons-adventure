

# Fix: Auto-battle target focusing

## Problem
In `src/components/game/battle/TeamBattleArena.tsx`, lines 392-393, the auto-battle selects a **random** attacker and **random** target every turn:

```typescript
const randomPair = currentAlivePairs[Math.floor(Math.random() * currentAlivePairs.length)];
const randomTarget = currentAliveOpponents[Math.floor(Math.random() * currentAliveOpponents.length)];
```

## Fix

Replace the random selection with deterministic, focus-fire logic:

1. **Attacker**: Pick pairs in attack order (sorted by `attackOrder`), cycling through them sequentially using a ref counter.
2. **Target**: Always pick the **first alive opponent** (`currentAliveOpponents[0]`). Since dead opponents are filtered out, when the focused target dies, the next one automatically becomes index 0.

### Changes in `TeamBattleArena.tsx`

**Add a ref** for tracking the current attacker index in the rotation:
```typescript
const autoAttackIndexRef = useRef(0);
```

**Replace lines 392-393** with:
```typescript
const sortedPairs = [...currentAlivePairs].sort((a, b) => a.attackOrder - b.attackOrder);
const attackerIndex = autoAttackIndexRef.current % sortedPairs.length;
const attacker = sortedPairs[attackerIndex];
autoAttackIndexRef.current = attackerIndex + 1;
const target = currentAliveOpponents[0]; // Focus first alive enemy
```

This ensures all team members attack the same target in order until it dies, then move to the next.

