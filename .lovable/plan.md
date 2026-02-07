

# Fix Auto-Battle + Migrate Dungeon Dice to PvP System

## Problems

### 1. Auto-battle stops working after level transition
The auto-battle effect in `TeamBattleArena.tsx` has `alivePairs` and `aliveOpponents` (filtered arrays) directly in its dependency array. These create new array references on every render, causing the effect to re-trigger constantly. Each re-trigger clears the previous 1-second timeout via the cleanup function, so the timer never completes and the auto-attack never fires.

### 2. Dungeon dice uses a dual-roll system instead of PvP single-roll
Currently, dungeons use `calculateD6Damage` from `battleCalculations.ts` which rolls TWO dice (attacker vs defender) and compares them. PvP uses a single D6 roll with percentage-based damage modifiers (1=counter, 2=miss, 3=50%, 4=100%, 5=150%, 6=200%). The user wants dungeons to use the same PvP system.

---

## Plan

### Part 1: Fix Auto-Battle

**File:** `src/components/game/battle/TeamBattleArena.tsx`

Replace `alivePairs` and `aliveOpponents` array references in the auto-battle `useEffect` dependency list with their `.length` values (which are already included). Remove the raw arrays from dependencies to prevent the effect from constantly re-triggering.

Additionally, stabilize `onAttack` by removing it from the effect dependencies (it changes on every render from parent). Use a ref to track the latest callback instead.

```text
Current (line 304-328):
  useEffect(() => {
    if (autoBattle && isPlayerTurn && !isAttacking && alivePairs.length > 0 && aliveOpponents.length > 0) {
      const timer = setTimeout(() => {
        const randomPair = alivePairs[...];
        const randomTarget = aliveOpponents[...];
        ...
      }, adjustDelay(1000));
      return () => clearTimeout(timer);
    }
  }, [autoBattle, isPlayerTurn, isAttacking, alivePairs.length, aliveOpponents.length,
      alivePairs, aliveOpponents, onAttack, adjustDelay]);  // <-- arrays cause re-renders

Fix:
  - Use refs (onAttackRef, alivePairsRef, aliveOpponentsRef) for values used inside the timeout
  - Remove array references and callback from dependencies
  - Keep only stable primitives: autoBattle, isPlayerTurn, isAttacking, lengths, adjustDelay
```

### Part 2: Migrate Dice System from Dual-Roll to Single-Roll (PvP Formula)

**File:** `src/hooks/team/useTeamBattle.ts`

Replace `calculateD6Damage` (dual dice) with `calculateDiceDamage` from `src/utils/diceFormula.ts` (single dice, PvP formula) in both `executePlayerAttack` and `executeEnemyAttack`.

#### Changes to `executePlayerAttack`:
```text
Current:
  import { calculateD6Damage } from '@/utils/battleCalculations';
  ...
  const damageResult = calculateD6Damage(attackingPair.power, target.armor || 0);
  const appliedDamage = damageResult.attackerRoll > damageResult.defenderRoll ? damageResult.damage : 0;
  const isBlocked = damageResult.isDefenderCrit || damageResult.attackerRoll <= damageResult.defenderRoll;

New:
  import { calculateDiceDamage, getDiceMultiplier, isMiss, isCounterAttack, isCriticalHit } from '@/utils/diceFormula';
  ...
  const roll = Math.floor(Math.random() * 6) + 1;
  const appliedDamage = calculateDiceDamage(roll, attackingPair.power, target.armor || 0);
  const missed = isMiss(roll);
  const isCritical = isCriticalHit(roll);
  const isCounter = isCounterAttack(roll);
```

The `lastRoll` will change from dual values (`attackerRoll` + `defenderRoll`) to single roll info:

```text
setLastRoll({
  attackerRoll: roll,
  defenderRoll: undefined,  // No defender roll in new system
  source: 'player',
  damage: appliedDamage,
  isBlocked: missed,
  isCritical: isCritical,
  isMiss: missed,
  isCounterAttack: isCounter,
  level: battleState.level,
  targetOpponentId: targetId
});
```

#### Changes to `executeEnemyAttack`:
Same transformation -- single roll, same formula, apply damage via `calculateDiceDamage`.

#### Counterattack handling:
When roll = 1 (counterattack), the enemy/player gets a free counterattack with its own dice roll, matching PvP behavior.

### Part 3: Update UI Dice Display

**File:** `src/components/game/battle/TeamBattleArena.tsx`

The center combat panel currently shows two dice (Player + Monster) side by side. With the new single-roll system, only ONE dice is relevant per turn:
- Player's turn: show player's dice result only
- Enemy's turn: show enemy's dice result only

Update the `InlineDiceDisplay` usage to show only the attacker's roll. The second dice becomes either hidden or shows a damage percentage description instead.

**File:** `src/components/game/battle/InlineDiceDisplay.tsx`

Optionally extend to show the percentage result (e.g., "150%") alongside the dice number, matching PvP's visual style.

### Part 4: Update `lastRoll` type

**File:** `src/hooks/team/useTeamBattle.ts` and `src/components/game/battle/TeamBattleArena.tsx`

Extend the `lastRoll` interface to include new PvP-style fields:

```text
lastRoll?: {
  attackerRoll: number;
  defenderRoll?: number;      // Optional (not used in new system)
  source: 'player' | 'enemy';
  damage: number;
  isBlocked: boolean;
  isCritical?: boolean;
  isMiss?: boolean;            // NEW
  isCounterAttack?: boolean;   // NEW
  counterAttackDamage?: number; // NEW
  level: number;
} | null;
```

---

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/team/useTeamBattle.ts` | Replace `calculateD6Damage` with `calculateDiceDamage` from diceFormula; add counterattack logic; update lastRoll format |
| `src/components/game/battle/TeamBattleArena.tsx` | Fix auto-battle dependencies using refs; update dice display for single-roll; update lastRoll consumption |
| `src/components/game/battle/InlineDiceDisplay.tsx` | Minor update to support showing damage percentage |

### Dice Formula Comparison

```text
CURRENT (Dungeon - dual roll):
  Attacker rolls D6, Defender rolls D6
  If attacker > defender: damage = ATK - Armor
  If defender >= attacker: no damage
  Equal: re-roll

NEW (PvP formula - single roll):
  Roll 1: 0% damage + counterattack
  Roll 2: 0% damage (miss)
  Roll 3: 50% damage
  Roll 4: 100% damage
  Roll 5: 150% damage
  Roll 6: 200% damage (critical)
  Damage = max(1, floor(ATK * percent) - Defense)
```

