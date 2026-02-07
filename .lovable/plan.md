

# Fix: Mouse wheel scrolling on PvP page

## Root Cause

The Grimoire page and PvP page use fundamentally different scrolling architectures:

**Grimoire (works):**
- Uses `h-screen` to constrain the page to viewport height
- Has `flex flex-col` on the root container
- Inner content div uses `flex-1 overflow-y-auto`, creating an **explicit scroll container**

**PvP (broken):**
- Uses `min-h-screen` without height constraint
- Content grows beyond the viewport
- Relies on body-level scrolling, but global CSS (`overflow-x: hidden` on body, `#root`, and the App wrapper) causes browsers to compute `overflow-y: auto` on those elements too (per CSS spec), creating **conflicting scroll containers** that trap wheel events

## Solution

Refactor `PvPHub.tsx` to match the Grimoire's scroll pattern: constrain the page to viewport height and provide an explicit `overflow-y-auto` scroll container.

### Changes to `src/components/game/pvp/PvPHub.tsx`

**Before (line 187-189):**
```text
<div className="min-h-screen bg-pvp p-4 relative">
  <div className="absolute inset-0 bg-black/50 pointer-events-none" />
  <div className="max-w-4xl mx-auto space-y-4 relative z-10">
```

**After:**
```text
<div className="h-screen bg-pvp relative flex flex-col">
  <div className="absolute inset-0 bg-black/50 pointer-events-none" />
  <div className="flex-1 overflow-y-auto relative z-10 p-4">
    <div className="max-w-4xl mx-auto space-y-4">
```

And the corresponding closing tags need adjustment (closing `</div>` added before the Dialog).

**What changes:**
1. Root div: `min-h-screen p-4` becomes `h-screen flex flex-col` (constrain to viewport, enable flex layout)
2. New scroll wrapper: `flex-1 overflow-y-auto relative z-10 p-4` (explicit scrollable area fills remaining space)
3. Inner content div: loses `relative z-10` (moved to parent scroll wrapper)

**What stays the same:**
- Background overlay with `pointer-events-none`
- All content, cards, components, dialogs
- Team dialog remains outside the scroll area (renders at portal level anyway)

### Why this works

The `overflow-y-auto` on a `flex-1` container creates a clear scroll target for the browser. Wheel events land on the scroll container and are properly handled, rather than getting lost in the chain of implicit scroll containers created by `overflow-x: hidden` on parent elements.

### No impact on functionality

- All PvP content renders identically
- Internal scroll areas (leaderboard `max-h-[400px]`, match history `ScrollArea`) continue working
- Dialog overlays are unaffected (they use portals)
- Background image with `background-attachment: fixed` continues working
- The `pointer-events-none` overlay behavior is preserved

