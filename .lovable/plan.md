

# Fix: Team Page Scrolling, PvP Navigation, Performance, and Layout Issues

## Issues Identified

1. **Mouse scroll not working on Team page (TG bot on PC)**: The `TeamStats` page uses `min-h-screen` for both the outer container and the inner `z-10` div, which creates no explicit scroll container. Per the project's own architecture memory, `min-h-screen` causes scroll issues -- the fix is `h-screen flex flex-col` with `flex-1 overflow-y-auto` on the content area.

2. **No way to return to PvP from Team page**: When navigating from PvP Hub ("Собрать команду", "Подробнее", "Сменить команду") to `/team`, the back button always goes to `/menu`. There's no way to go back to PvP without going through the main menu.

3. **Performance lag when switching tabs in Team section**: The `DeckSelection` component has excessive `console.log` calls in production (dozens of logs per render cycle in `useMemo` hooks for heroes, dragons, and synced pairs). Additionally, `localCards` duplicates the same card-building logic already done in `MultiTeamCards` but rebuilds it independently, causing redundant processing.

4. **PvP layout overflow -- team avatars going beyond right edge**: The avatars row in PvP Hub uses `flex` with `gap-1.5` but has no `overflow-hidden` or `flex-wrap`, so with 5 hero+dragon pairs (up to 10 images), it overflows on narrow screens.

---

## Solution

### 1. Fix Team Page Scroll (TeamStats.tsx)

Change the layout pattern from `min-h-screen` to the proven `h-screen` + `overflow-y-auto` pattern:

- Outer div: `h-screen flex flex-col` (instead of `min-h-screen`)
- Background overlay: `pointer-events-none` (to not block scroll events)
- Inner content div: `h-screen` replaced with `flex-1 overflow-y-auto`

### 2. Add "Back to PvP" Navigation (TeamStats.tsx)

Pass referrer info via URL search params when navigating from PvP to Team:
- In `PvPHub.tsx`: Change `navigate("/team")` to `navigate("/team?from=pvp")` in all 3 places
- In `TeamStats.tsx`: Read `searchParams`, and if `from=pvp`, change the back button to navigate to `/pvp` instead of `/menu`, with label "Back to PvP"

### 3. Reduce Performance Lag (DeckSelection.tsx)

- Remove all `console.log` statements from production code paths (keep only behind `import.meta.env.DEV` guards, or remove entirely)
- This eliminates dozens of string serializations (`JSON.stringify`) per render cycle

### 4. Fix PvP Team Avatars Overflow (PvPHub.tsx)

- Add `flex-wrap` and `overflow-hidden` to the avatars row container
- Limit avatar sizes to prevent overflow on narrow screens

---

## Technical Details

### Files to modify:

**`src/pages/TeamStats.tsx`** (scroll fix + back navigation)
- Line 18: `min-h-screen flex flex-col` -> `h-screen flex flex-col`
- Line 19: Add `pointer-events-none` to overlay
- Line 21: `min-h-screen` -> `flex-1 overflow-y-auto`
- Line 23: Read `useSearchParams()` and conditionally navigate to `/pvp` or `/menu`

**`src/components/game/pvp/PvPHub.tsx`** (navigation + layout)
- Lines 170, 449, 605: `navigate("/team")` -> `navigate("/team?from=pvp")`
- Line 406-428: Add `flex-wrap overflow-hidden max-w-full` to avatars container

**`src/components/game/team/DeckSelection.tsx`** (performance)
- Remove ~20 console.log/console.warn calls from production paths (lines 13, 74-78, 116-117, 120-154, and others)

