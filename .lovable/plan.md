

## PvP Battle Issues Analysis & Fix Plan

### Investigation Results

**1. Dice fairness — CONFIRMED FAIR**
Last 7 days dice distribution (from `pvp_moves`):
- Bot rolls: 1=15, 2=15, 3=16, 4=21, 5=15, 6=16 (total 98)
- Human rolls: 1=17, 2=8, 3=19, 4=13, 5=23, 6=16 (total 96)

Both sides use identical `Math.random()` D6. The dice are fair. The **perceived** unfairness comes from the counterattack mechanic (see below).

**2. "Bot hits twice" — REAL DESIGN ISSUE**
When the player rolls 1 (critical miss):
- Player deals 0 damage
- Bot gets a counterattack with a fresh D6 roll (can deal 100-200% damage)
- Then the bot takes its **normal turn** and deals MORE damage

Result: player takes 2 hits and deals 0 damage in one round. This is symmetric (same happens when bot rolls 1), but with fewer pairs the compounding effect is devastating. One bad roll can kill a hero.

**Fix**: Remove the extra counterattack dice roll. On roll=1, the counterattack should deal a fixed amount (e.g., 50% of defender's power) instead of rolling again with full damage potential. This reduces the "double hit" feeling.

**3. Battle result screen — REAL BUG**
When the match ends during a `trigger_bot_turn` call (bot's turn kills last player hero, or counterattack kills last bot hero), the frontend shows the bot's dice animation for 2s, then calls `getMatchStatus()`. The match is 'completed', so `matchData.status === 'completed'` renders the result card in `PvPBattle.tsx`. But the player reports having to press back manually.

Root cause: The completed screen (lines 297-325 in PvPBattle.tsx) renders correctly, BUT when the match ends during the player's OWN attack where the bot's inline turn kills the player, the response has `match_status: 'completed'` but the code doesn't check it — it waits for `loadMatch()` which eventually shows the result. However, there's no auto-redirect or persistent modal. The result card IS showing, but it requires clicking "Вернуться в арену". This matches the player's feedback: "нужно самому на стрелку назад жать".

**Fix**: Add auto-redirect to `/pvp` after 10 seconds on the completed screen, with a countdown indicator. Also add a more prominent result modal instead of relying on detecting status change.

**4. PvP battle logging — FEATURE REQUEST**
Player wants dice roll statistics logged and analyzable.

### Plan

#### 1. Fix counterattack mechanic (Edge Function `pvp-submit-move`)
- On roll=1, counterattack deals **fixed 50% of defender's power minus attacker's defense** instead of rolling a new D6 with full damage range
- This makes counterattacks predictable and less devastating
- Apply the same change in all 3 places: player attack (line 550), bot inline turn (line 782), and trigger_bot_turn (line 308)

#### 2. Add auto-redirect on battle completion (`PvPBattle.tsx`)
- When `matchData.status === 'completed'`, start a 10-second countdown
- Show countdown on the result card ("Автоматический переход через X сек.")
- Navigate to `/pvp` when countdown expires
- Player can still click "Вернуться" to go immediately

#### 3. Add PvP battle statistics logging
- Create an admin view or extend `PvPMatchHistory` to show per-match dice roll breakdowns
- Add a simple RPC `get_pvp_dice_stats` that aggregates rolls by player type (human vs bot) for the last N days
- Show this on the admin panel for monitoring fairness

### Files to modify
1. `supabase/functions/pvp-submit-move/index.ts` — Fix counterattack to use fixed 50% power
2. `src/components/game/pvp/PvPBattle.tsx` — Add auto-redirect countdown on completed screen
3. `src/components/game/pvp/PvPRollHistory.tsx` — Minor: label update for counterattack display
4. New SQL migration — Add `get_pvp_dice_stats` RPC for admin monitoring

