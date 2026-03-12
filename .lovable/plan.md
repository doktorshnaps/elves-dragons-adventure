

# Audit: Game Functionality -- Broken Connections and Issues Found

After a thorough review of the codebase, I found **4 confirmed issues** and **2 potential risks**.

---

## Issue 1 (CRITICAL): `buildingLevels` fallback missing `forge` and `clan_hall` in `useUnifiedGameState.ts`

**File**: `src/hooks/useUnifiedGameState.ts`, lines 437-445

The `transformServerData` function has a hardcoded fallback for `buildingLevels` that is missing `forge` and `clan_hall`:

```text
buildingLevels: serverData.building_levels ?? {
  main_hall: 0, workshop: 0, storage: 0,
  sawmill: 0, quarry: 0, barracks: 0,
  dragon_lair: 0, medical: 0
  // MISSING: forge, clan_hall
}
```

Meanwhile, `GameDataContext.tsx` (line 66-77) and `useShelterState.ts` (line 161-192) correctly include both `forge` and `clan_hall`. This means when data flows through `useUnifiedGameState` (used by `useShelterState` via `useBatchedGameState`), the fallback object silently drops these two buildings, potentially resetting their levels to `undefined` in edge cases.

**Impact**: If `building_levels` is null/undefined from DB, forge and clan_hall levels become `undefined`, causing UI to show them as unbuilt even after upgrading.

**Fix**: Add `forge: 0` and `clan_hall: 0` to the fallback object in `transformServerData`.

---

## Issue 2 (MODERATE): `initialGameData` also missing `forge` and `clan_hall`

**File**: `src/hooks/useUnifiedGameState.ts`, lines 52-62

The `initialGameData` constant (used as the default before any data loads) also has the same missing buildings:

```text
buildingLevels: {
  main_hall: 0, workshop: 0, storage: 0,
  sawmill: 0, quarry: 0, barracks: 0,
  dragon_lair: 0, medical: 0
  // MISSING: forge, clan_hall
}
```

**Fix**: Add `forge: 0` and `clan_hall: 0`.

---

## Issue 3 (MODERATE): Excessive `console.log` in production across multiple critical files

**Files affected**:
- `src/contexts/GameDataContext.tsx` -- 93+ console.log calls
- `src/hooks/useGameSync.ts` -- 30+ console.log calls  
- `src/hooks/shelter/useShelterState.ts` -- 40+ console.log calls (including inside `canAffordUpgrade` which runs on every render)
- `src/hooks/useBuildingUpgrades.ts` -- 15+ console.log calls

These are not behind `import.meta.env.DEV` guards. In the Telegram bot context, excessive logging degrades performance -- especially `canAffordUpgrade` which logs on every render cycle with object dumps.

**Impact**: Slower performance in TG bot, especially on shelter page. Contributes to the lag users experience.

**Fix**: Wrap all debug logs in `if (import.meta.env.DEV)` blocks, or remove them entirely in frequently-called functions like `canAffordUpgrade`.

---

## Issue 4 (LOW): `useUnifiedGameState.onSuccess` writes to localStorage

**File**: `src/hooks/useUnifiedGameState.ts`, lines 117-127

The mutation `onSuccess` handler saves `activeWorkers` and the full `gameData` object to localStorage:

```typescript
localStorage.setItem('activeWorkers', JSON.stringify(updatedData.activeWorkers));
localStorage.setItem('gameData', JSON.stringify(updatedData));
```

This contradicts the architecture decision documented in `GameDataContext.tsx` (line 255-256): "OPTIMIZATION: Fully removed localStorage sync -- data only in React Query and Supabase". This creates inconsistency and potential stale data issues.

**Fix**: Remove the localStorage writes from `useUnifiedGameState.onSuccess`.

---

## Potential Risk 1: `useGameSync` still syncs `selectedTeam` to game_data

**File**: `src/hooks/useGameSync.ts`, lines 196-228

The Zustand-to-Supabase sync subscriber still includes `selectedTeam` in its snapshot and syncs it to `game_data.selected_team`. However, per architecture memory, dungeon teams are now exclusively managed through `player_teams` table. This sync writes stale/empty `selectedTeam` to `game_data`, which is harmless for dungeons (since they read from `player_teams`) but wastes network traffic and could cause confusion.

**Impact**: Low -- no functional breakage since dungeons read from `player_teams`, but it's dead code that could mask issues.

---

## Potential Risk 2: `useBuildingUpgrades` completion toast fires repeatedly

**File**: `src/hooks/useBuildingUpgrades.ts`, lines 49-73 and 76-104

Both the `useEffect` (line 49) and the `setInterval` (line 76) check for completed upgrades and call `toast()`. Because the `useEffect` depends on `activeUpgrades` and `toast`, and `toast` is not stable (creates new reference each render), this can trigger repeatedly, showing duplicate "Upgrade complete" toasts.

**Impact**: Users may see multiple toast notifications for the same upgrade completion.

---

## Summary of Changes

| # | File | Issue | Severity |
|---|------|-------|----------|
| 1 | `useUnifiedGameState.ts` line 437 | Add `forge: 0, clan_hall: 0` to fallback | Critical |
| 2 | `useUnifiedGameState.ts` line 52 | Add `forge: 0, clan_hall: 0` to initialData | Moderate |
| 3 | Multiple files | Wrap console.log in DEV guard or remove | Moderate |
| 4 | `useUnifiedGameState.ts` line 117 | Remove localStorage writes | Low |

I recommend implementing fixes 1-4. The potential risks (5-6) can be addressed separately if needed.

