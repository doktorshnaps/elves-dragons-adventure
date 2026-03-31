

## Problem

`displayRarity` (derived from `getCardRarityByName`) is used for **both** color styling **and** star count. Since "Ветеран" maps to rarity 3, it shows 3 stars. Since "Этернал" maps to 7, it shows 7 stars. But all pack cards should show **1 star** (their actual `card.rarity`).

## Solution

Separate the two concerns:
- **Visual rarity** (`displayRarity` from `getCardRarityByName`) → used for border colors, glow, shimmer
- **Star count** (`card.rarity`) → used for the star icons, always 1 for pack drops

### File 1: `src/components/game/dialogs/CardPackAnimation.tsx` (line 360)
Change star rendering from `displayRarity` to `card.rarity`:
```tsx
{Array.from({ length: card.rarity || 1 }, (_, i) => (
```

### File 2: `src/components/game/dialogs/CardsSummaryGrid.tsx` (line 75)
Same change:
```tsx
{Array.from({ length: card.rarity || 1 }, (_, i) => (
```

No other changes needed. Colors stay class-based via `getCardRarityByName`, stars use the actual `rarity` field.

