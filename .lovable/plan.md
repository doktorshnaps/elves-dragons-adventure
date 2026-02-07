

# Comprehensive Game Audit: Functions, Logic, UX, and UI

---

## 1. SCROLLING ISSUES (Multiple Pages)

**Problem:** Many pages use `min-h-screen` without explicit scroll containers, which conflicts with the global `overflow-x-hidden` on `#root` and the App wrapper div (line 76 of `App.tsx`). This causes mouse wheel scrolling to fail on multiple pages -- the same root cause that was previously fixed on `PvPHub` and `PvPBattle`.

**Affected pages:**
- `/menu` (Menu.tsx) -- uses `min-h-screen`, no explicit scroll container
- `/shelter` (Shelter.tsx) -- uses `min-h-screen`
- `/quest` (QuestPage.tsx) -- uses `min-h-screen`
- `/soul-archive` (SoulArchive.tsx) -- uses `min-h-screen`
- `/admin-settings` (AdminSettings.tsx) -- uses `min-h-screen`
- `/clan` (Clan.tsx) -- uses `min-h-screen`
- `/adventure` (AdventuresPage.tsx) -- uses `min-h-screen`
- `/shop` (ShopPage.tsx) -- uses `min-h-screen`
- All dungeon pages (SpiderNest, IcyThrone, etc.) -- use `min-h-screen`

**Fix:** Apply the same pattern used in Grimoire and PvPHub: replace `min-h-screen` with `h-screen flex flex-col` and wrap scrollable content in `flex-1 overflow-y-auto`.

**Priority:** HIGH -- Affects core usability across the entire application.

---

## 2. ADVENTURE MODE -- DICE FORMULA INCONSISTENCY WITH PVP

**Problem:** The Adventure mode (`useDiceRoll.ts`) uses a different dice multiplier table than PvP (`PvPBattleArena.tsx`), creating inconsistent game mechanics:

| Roll | Adventure Mode       | PvP Mode              |
|------|----------------------|-----------------------|
| 1    | 0% (miss)            | 0% + Counterattack    |
| 2    | 50%                  | 0% (miss)             |
| 3-4  | 100%                 | 50% / 100%            |
| 5    | 150%                 | 150%                  |
| 6    | 200%                 | 200%                  |

Players learn one system in Adventures and encounter a completely different one in PvP. Roll 2 deals 50% in Adventure but 0% in PvP.

**Fix:** Unify the dice formula across all game modes, or clearly document the difference in-game. The PvP formula (with counterattack on 1, miss on 1-2) is more strategic and should be adopted as the standard.

**Priority:** MEDIUM -- Confuses players transitioning between modes.

---

## 3. ADVENTURE MODE -- DAMAGE HANDLING BUG

**Problem:** In `AdventureGame.tsx`, the `useDiceRoll` hook's `onDamage` callback is called for both player and monster damage, but the callback doesn't distinguish between them. The `isMonsterTurn` state is checked inside `handlePlayerAttack` to route damage, but the dice roll hook returns a *single* `onDamage` callback:

```typescript
// Lines 96-105 of AdventureGame.tsx
const { isRolling, diceRoll, monsterDiceRoll, isMonsterTurn, handlePlayerAttack } = useDiceRoll((damage: number) => {
    if (isMonsterTurn) {
      setCurrentHealth(prev => Math.max(0, prev - damage));
      applyDamageToTeam(damage);
    } else {
      handleMonsterDamage(damage);
    }
});
```

The `isMonsterTurn` state here is a React state that may not be updated by the time the callback fires (closure stale reference). This creates a race condition where monster damage could be incorrectly applied to the monster instead of the player.

**Fix:** Pass the damage source explicitly as a parameter in `useDiceRoll` callback, e.g., `onDamage(damage, 'player' | 'monster')`.

**Priority:** HIGH -- Can cause incorrect damage application during combat.

---

## 4. ADVENTURE MODE -- MONSTER SPAWNING USES WRONG PARAMETERS

**Problem:** In `AdventureGame.tsx`, `useMonsterSpawning` is called with parameters that don't match its expected signature:

```typescript
// AdventureGame.tsx line 52
const { monsters, setMonsters } = useMonsterSpawning(currentMonster?.position || 0, !!currentMonster, false);
```

But `useMonsterSpawning` expects:
```typescript
// useMonsterSpawning.ts signature
export const useMonsterSpawning = (
  playerPosition: number,      // receives: currentMonster?.position
  isMovingRight: boolean,       // receives: !!currentMonster (boolean but wrong semantics)
  isMovingLeft: boolean         // receives: false
)
```

The `isMovingRight` parameter is being passed `!!currentMonster` (whether a monster exists), not whether the player is moving right. This breaks spawn direction logic -- monsters always spawn at `position + 400` when any monster exists, regardless of player movement direction.

**Fix:** Either pass correct movement direction booleans, or refactor spawning to not depend on movement direction (since Adventures use a different movement model than the game world).

**Priority:** MEDIUM -- Monster spawning positions may be incorrect.

---

## 5. PVP -- HARDCODED SUPABASE CREDENTIALS IN CLIENT CODE

**Problem:** `usePvP.ts` contains hardcoded Supabase URL and anon key in multiple places (lines 621-622, 674-675, 703-704) for direct `fetch()` calls to edge functions instead of using the shared Supabase client:

```typescript
const supabaseUrl = 'https://oimhwdymghkwxznjarkv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIs...';
```

While the anon key is public, this pattern:
- Creates maintenance burden (must update in multiple places)
- Bypasses any middleware or interceptors on the Supabase client
- Duplicates configuration from `.env`

**Fix:** Use `supabase.functions.invoke()` from the shared client, or import the URL/key from environment variables.

**Priority:** LOW -- Works but is a maintenance risk.

---

## 6. PVP BATTLE -- NO RECONNECTION HANDLING

**Problem:** If a player's connection drops during a PvP battle, there is no reconnection mechanism. The polling interval (3 seconds) continues but if the page is closed, the match can only be resumed by navigating back to `/pvp` and clicking the active match. The turn timer continues counting down on the server, potentially causing an unfair timeout.

**Fix:** Add a visual reconnection indicator and consider pausing the timer during detected disconnections. Show active matches more prominently on the PvP hub page when returning.

**Priority:** MEDIUM -- Can cause unfair losses.

---

## 7. PVP -- INITIATIVE OVERLAY ALWAYS SHOWS PLAYER AS "player1"

**Problem:** In `PvPBattleArena.tsx` line 695:
```typescript
const iWonInitiative = initiative.first_turn === "player1";
```

This always checks if `first_turn === "player1"`, but the current player might be player2. The variable `amIPlayer1` from `PvPBattle.tsx` is not passed to the arena, so the initiative result display may be inverted for player2.

**Fix:** Pass the `amIPlayer1` flag to `PvPBattleArena` and use it to correctly determine who won initiative.

**Priority:** HIGH -- Shows wrong initiative result to half of players.

---

## 8. UI -- SHELTER PAGE HAS 7 TABS ON MOBILE

**Problem:** The Shelter page (`Shelter.tsx`) renders 7 tabs in a `grid-cols-4 sm:grid-cols-7` layout. On mobile (4 columns), 3 tabs wrap to a second row. On very small screens, the icon-only tabs are tiny and hard to tap. Tab labels are hidden on mobile (`hidden sm:inline`), leaving only small icons with no visual distinction.

**Fix:** Consider:
- Using a horizontal scrollable tab bar instead of grid
- Adding short labels below icons even on mobile
- Grouping related tabs (e.g., Medical + Forge under "Services")

**Priority:** LOW -- Functional but not user-friendly on mobile.

---

## 9. MENU PAGE -- NO SCROLL CONTAINER + MANY BUTTONS

**Problem:** The main menu has 11+ buttons in a grid, plus admin buttons and a top bar with balance info. On mobile or smaller screens, the content extends beyond the viewport, but the page uses `min-h-screen` without an explicit scroll container (the same global scroll issue described in item 1).

**Priority:** HIGH -- Main entry point of the app; must scroll reliably.

---

## 10. ADVENTURE MODE -- GAME OVER REDIRECTS TO /menu AFTER 2 SECONDS

**Problem:** When the player dies in Adventure mode, `useGameState.ts` (line 28-35) and `AdventuresTab.tsx` (line 98-102) both independently redirect to `/menu` after 2 seconds. This creates a double navigation. The toast "Game Over" shows for only 2 seconds, which may not be enough for the player to read it.

**Fix:** Consolidate the redirect logic to a single location and increase the delay to 3-4 seconds, or show a modal with a "Return to Menu" button instead of auto-redirecting.

**Priority:** LOW -- Minor UX annoyance.

---

## 11. STATE MANAGEMENT -- DUPLICATE `handleSelectTarget` IN ADVENTURE

**Problem:** `handleSelectTarget` is defined in both `useGameState.ts` and `AdventureGame.tsx`. The one in `useGameState.ts` is returned but never used -- `AdventureGame.tsx` defines its own version (line 54-62). This creates dead code and confusion.

**Fix:** Remove the unused `handleSelectTarget` from `useGameState.ts` or consolidate the logic.

**Priority:** LOW -- Dead code, no functional impact.

---

## 12. PVP -- LEADERBOARD SHOWS "matches_played" INSTEAD OF ELO

**Problem:** The live leaderboard (`PvPLeaderboard.tsx` line 254-256) displays `matches_played` as the primary metric:
```tsx
<div className="text-lg font-bold">{entry.matches_played}</div>
<div className="text-[10px] text-muted-foreground">матчей</div>
```

Players primarily care about their ELO/rank position, but the leaderboard shows total matches played as the main number. The season leaderboard correctly shows ELO, creating an inconsistency between tabs.

**Fix:** Show ELO as the primary metric in the live leaderboard, with wins/losses/matches as secondary info.

**Priority:** MEDIUM -- Misleading ranking display.

---

## 13. PVP -- OPPONENT ATTACK TARGET SELECTION IS GUESSWORK

**Problem:** When the opponent attacks (in `PvPBattleArena.tsx` lines 366-367), the target is determined by finding the first alive pair:
```typescript
targetIdx = currentMyPairs.findIndex(p => p.currentHealth > 0);
attackerIdx = currentOpponentPairs.findIndex(p => p.currentHealth > 0);
```

But the server may have used different attacker/target indices. The visual animation might highlight the wrong cards because the client doesn't receive the actual attacker/target pair indices from the server response for opponent turns.

**Fix:** Include `attacker_pair_index` and `target_pair_index` in the match status response for recent moves, so the client can accurately display which units are fighting.

**Priority:** MEDIUM -- Visual mismatch between animation and actual combat.

---

## 14. PERFORMANCE -- ADVENTURE usePlayerStats TRIGGERS INFINITE RE-RENDERS

**Problem:** In `usePlayerStats.ts` (line 184-194), a `useEffect` calls `updateStats` which triggers `updateGameData`, which changes `gameData`, which re-triggers the effect:

```typescript
useEffect(() => {
    // ... calculates new values
    updateStats(prev => ({ ...prev, health: ..., currentDefense: ..., maxDefense: ... }));
}, [calculateEquipmentBonuses, getTeamHealthSums, getTeamDefenseSums, updateStats, cards, gameData.selectedTeam]);
```

`updateStats` calls `updateGameData` (line 162-163), which changes `gameData` via context, which may cause `getTeamHealthSums` and `getTeamDefenseSums` to recompute, triggering the effect again. This can cause rapid re-renders or even an infinite loop if the calculated values oscillate.

**Fix:** Add a comparison check before calling `updateStats` -- only update if the calculated values actually changed.

**Priority:** HIGH -- Can cause performance degradation or infinite loops.

---

## Summary of Recommended Fixes by Priority

**HIGH priority (functional bugs and core UX):**
1. Scrolling fix across all pages (items 1, 9)
2. Adventure dice damage race condition (item 3)
3. PvP initiative display bug for player2 (item 7)
4. usePlayerStats infinite re-render risk (item 14)

**MEDIUM priority (inconsistencies and misleading UI):**
5. Dice formula inconsistency between modes (item 2)
6. Monster spawning wrong parameters (item 4)
7. PvP reconnection handling (item 6)
8. Leaderboard showing matches instead of ELO (item 12)
9. Opponent attack target mismatch (item 13)

**LOW priority (code quality and minor UX):**
10. Hardcoded Supabase credentials (item 5)
11. Shelter 7-tab mobile layout (item 8)
12. Double game-over redirect (item 10)
13. Duplicate handleSelectTarget dead code (item 11)

---

## Technical Implementation Notes

### Scrolling Fix Pattern (for all affected pages)

```text
BEFORE:
<div className="min-h-screen p-4 relative">
  {content}
</div>

AFTER:
<div className="h-screen relative flex flex-col">
  <div className="flex-1 overflow-y-auto p-4">
    {content}
  </div>
</div>
```

Each page needs individual attention because some have background images with `absolute inset-0`, overlay divs with `pointer-events-none`, or fixed headers that should remain outside the scroll container.

### Dice Formula Unification

Create a shared `diceMultiplier` utility:
```text
src/utils/diceFormula.ts
  - getDiceMultiplier(roll: number): number
  - getDiceDescription(roll: number): { text: string; color: string }
  - isCounterAttack(roll: number): boolean
  - isMiss(roll: number): boolean
```

Then import it in both `useDiceRoll.ts` (Adventure) and `PvPBattleArena.tsx` (PvP).
