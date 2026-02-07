

# Auto-Select Cards in PvP

## Current Behavior
Each turn the player must:
1. Click on one of their own pairs (attacker)
2. Click on one of the opponent's pairs (target)
3. Click "Атаковать"

This means 3 clicks per turn, which can get tedious across many turns.

## Proposed Solution
Add a toggle "Автовыбор" in the action panel of the PvP battle. When enabled:
- The system automatically selects the **first alive pair** as the attacker
- The system automatically selects the **first alive opponent pair** as the target
- The player only clicks "Атаковать"

The player can still manually override any selection by clicking a different card while auto-select is active. After the attack resolves and a new turn begins, auto-select re-applies.

## How Auto-Select Picks Cards

| Role | Logic |
|------|-------|
| Attacker (my pair) | First pair with `currentHealth > 0` (by index) |
| Target (opponent pair) | First pair with `currentHealth > 0` (by index) |

This mirrors the bot's own targeting logic (first alive pair), keeping it simple and predictable.

## UI Changes

A toggle switch or button will appear next to the "Атаковать" button:
- Label: "Автовыбор"
- Visual: a small Switch component (from Radix UI, already installed)
- When enabled, pairs are pre-selected with their usual highlight colors
- The state persists throughout the match (saved in component state)

## Technical Details

**File: `src/components/game/pvp/PvPBattleArena.tsx`**

1. Add a `useState<boolean>` for `autoSelect`, defaulting to `false`
2. Add a `useEffect` that triggers when `isMyTurn` becomes `true` and `autoSelect` is on:
   - Find the first alive pair in `myPairs` -> set as `selectedPair`
   - Find the first alive pair in `opponentPairs` -> set as `selectedTarget`
3. Also re-apply auto-select after `handleAttack` completes and the next turn data arrives (the existing `handleAttack` already resets `selectedPair`/`selectedTarget` to `null`, and the effect above will re-fill them when new turn data loads)
4. Add a `Switch` + label in the action panel row, next to the attack button
5. Manual card clicks still work and override auto-selection while toggle is on

**No backend changes required** -- this is purely a frontend UX improvement.

