

# Comprehensive Game Audit: Game Design, Security, Architecture, and Performance

## 1. GAME DESIGN ISSUES

### 1.1 Dice Formula -- High Frustration (CRITICAL)
**File:** `src/utils/diceFormula.ts`

The D6 system has a 33% chance of dealing **zero damage** (rolls 1-2). Roll 1 = counterattack (0% damage + enemy free hit), Roll 2 = miss (0% damage). This means every third player action is wasted or punishing.

**Game design problem:** Players feel helpless. No agency mitigation, no pity system.

**Fix:** Implement a pity system -- after 2 consecutive misses, guarantee minimum 50% damage on next roll. Or change Roll 2 from 0% to 25% (glancing blow). Already noted in your improvement roadmap (Phase 1) but not implemented.

### 1.2 Adventure Mode -- Client-Side Rewards (CRITICAL)
**File:** `src/components/game/adventures/AdventuresTab.tsx`, line 47

```typescript
await updateGameData({ balance: balance + monster.reward });
```

Adventure rewards are calculated and applied entirely on the client. Unlike dungeons (which use `claim-battle-rewards` Edge Function), adventure mode directly writes balance changes. A player can modify `monster.reward` in DevTools to give themselves arbitrary ELL.

**Fix:** Create a server-side RPC or Edge Function for adventure reward claiming, similar to dungeon rewards.

### 1.3 Item Selling -- Hardcoded Price (LOW)
**File:** `src/components/game/adventures/AdventuresTab.tsx`, line 132

All items sell for a fixed 10 ELL regardless of rarity, type, or value. This is both a game design and economic issue.

**Fix:** Derive sell price from item rarity/type, e.g., `Math.floor(item.buyPrice * 0.3)`.

### 1.4 Account Experience -- Client-Side Leveling (MODERATE)
**File:** `src/stores/gameStore.ts`, lines 74-90

`addAccountExperience` computes level-ups purely in Zustand with a simple `level * 100` formula. No server validation. A player can call `useGameStore.getState().setAccountLevel(999)` in console.

**Fix:** Move experience/level calculation to a server-side RPC that validates and returns the new level.

### 1.5 Adventure Projectiles -- requestAnimationFrame Leak (MODERATE)
**File:** `src/components/game/adventures/game/hooks/useProjectiles.ts`, line 60

The projectile movement uses a single `requestAnimationFrame` per render cycle instead of a proper animation loop. Each render schedules one frame and cancels it on cleanup, but the effect runs on every render due to `onHit` and `monsters` dependencies changing, causing rapid re-registration.

**Fix:** Use a `useRef`-based animation loop with `requestAnimationFrame` inside a stable `useEffect`.

### 1.6 No Energy System in Adventures (DESIGN GAP)
Adventures have no energy/stamina cost. Players can farm indefinitely. Dungeons have energy, but adventures don't, creating an unlimited ELL faucet (especially with client-side rewards).

**Fix:** Either add energy cost to adventures or cap rewards per session.

---

## 2. SECURITY ISSUES

### 2.1 Client-Side Balance Mutation in Adventures (CRITICAL)
Already described in 1.2. The `updateGameData({ balance: balance + monster.reward })` call is trivially exploitable.

### 2.2 `localStorage` Auth Check in Router (MODERATE)
**File:** `src/App.tsx`, line 81

```typescript
localStorage.getItem('walletConnected') === 'true'
  ? <Navigate to="/menu" replace />
  : <Navigate to="/auth" replace />
```

Route decision based on localStorage. A user can set `walletConnected=true` to bypass the auth redirect. The `ProtectedRoute` component likely has proper checks, but the root `/` redirect is cosmetic-only.

**Fix:** Check wallet connection state from WalletContext, not localStorage.

### 2.3 `useResourceProduction` localStorage Fallback (LOW)
**File:** `src/hooks/useResourceProduction.ts`, lines 31-45

Resource collection timestamps fall back to localStorage, which can be manipulated to claim resources faster.

**Fix:** Trust only DB timestamps; remove localStorage fallback or treat it as display-only cache.

### 2.4 `useGameSync` Still Syncs `selectedTeam` to `game_data` (LOW)
**File:** `src/hooks/useGameSync.ts`, line 163

Per architecture notes, dungeon teams use `player_teams` table exclusively. This sync writes stale `selectedTeam` to `game_data`, wasting bandwidth. Already noted in plan.md.

---

## 3. ARCHITECTURE & CODE QUALITY

### 3.1 Excessive `console.log` in Production (MODERATE)
**Files:** 53 files, 1635+ console.log calls in `src/hooks/` alone.

Many are in hot paths (every-second timers, render cycles). This degrades performance in the Telegram bot context.

**Fix (Phase 1):** Wrap all debug logs in `if (import.meta.env.DEV)` guards. Priority files: `useBuildingUpgrades.ts`, `useResourceProduction.ts`, `GameDataContext.tsx`, `useUnifiedGameState.ts`.

### 3.2 Weak Typing -- `any` Throughout (MODERATE)
**File:** `src/stores/gameStore.ts`

`selectedTeam: any[]`, `battleState: any | null`, `teamBattleState: any | null`. Same pattern across contexts and hooks. This hides bugs and makes refactoring dangerous.

**Fix:** Define proper interfaces for `TeamPair[]`, `BattleState`, etc. and replace `any`.

### 3.3 Duplicate Field Mapping in `mapClientToServer` (LOW)
**File:** `src/hooks/useUnifiedGameState.ts`, lines 258-265

`woodLastCollectionTime`, `stoneLastCollectionTime`, `woodProductionData`, `stoneProductionData` are each mapped twice (duplicate lines).

**Fix:** Remove the 4 duplicate lines.

### 3.4 `useBuildingUpgrades` Double Toast (MODERATE)
**File:** `src/hooks/useBuildingUpgrades.ts`, lines 72-127

Both the `useEffect` (line 72) and the `setInterval` (line 99) check for completed upgrades and fire `toast()`. The `toast` reference is unstable, causing the `useEffect` to re-trigger. Result: duplicate "Upgrade complete" notifications.

**Fix:** Remove the toast from the `useEffect` and keep it only in the `setInterval`, or stabilize `toast` with `useRef`.

### 3.5 Deep Provider Nesting (LOW)
**File:** `src/App.tsx`, lines 62-120

11 nested providers. While functional, this creates deep component trees and can cause unnecessary re-renders.

**Fix:** Consider a `composeProviders` utility or consolidating related providers.

---

## 4. PERFORMANCE

### 4.1 `useMonsterSpawning` Missing Dependency (LOW)
**File:** `src/components/game/adventures/game/hooks/useMonsterSpawning.ts`, line 23

The initial monster spawn `useEffect` has an empty dependency array `[]` but references `monsters` and `generateMonster`. React will warn about missing deps.

### 4.2 Adventure Projectile Re-renders (MODERATE)
The `useProjectiles` hook creates new projectile objects on every animation frame via `setProjectiles`, triggering re-renders of the entire game tree every ~16ms.

**Fix:** Use `useRef` for projectile state and only sync to React state at a throttled rate (e.g., every 100ms).

---

## 5. RECOMMENDED ACTION PLAN

### Phase 1 -- Critical Security (1-2 days)
| # | Task | Severity |
|---|------|----------|
| 1 | Server-side adventure rewards (Edge Function) | Critical |
| 2 | Server-side account experience/leveling | Critical |
| 3 | Replace localStorage auth check in App.tsx router | Moderate |
| 4 | Remove localStorage fallback for resource timestamps | Low |

### Phase 2 -- Game Design Improvements (2-3 days)
| # | Task | Severity |
|---|------|----------|
| 5 | Implement pity system for D6 (min 25% on roll 2, pity after 2 misses) | High |
| 6 | Add energy cost or reward cap to adventures | High |
| 7 | Dynamic item sell prices based on rarity | Low |

### Phase 3 -- Code Quality & Performance (2-3 days)
| # | Task | Severity |
|---|------|----------|
| 8 | Wrap 1600+ console.logs in DEV guards (batch operation) | Moderate |
| 9 | Fix duplicate toast in useBuildingUpgrades | Moderate |
| 10 | Fix projectile animation loop (useRef pattern) | Moderate |
| 11 | Remove duplicate field mappings in mapClientToServer | Low |
| 12 | Replace `any` types in gameStore with proper interfaces | Low |
| 13 | Remove dead `selectedTeam` sync from useGameSync | Low |

### Phase 4 -- Strategic Game Design (from roadmap, ongoing)
| # | Task |
|---|------|
| 14 | Class-specific active abilities |
| 15 | Faction synergy bonuses |
| 16 | Roguelike dungeon mechanics (branching paths, events) |
| 17 | Achievement system |

**Total estimated effort for Phases 1-3:** ~5-8 days of focused work.

