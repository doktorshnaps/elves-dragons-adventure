

## Problem Analysis

There are **two distinct bugs** in the card pack opening flow:

### Bug 1: Roulette shows only Рекрут/Обычный cards
The previous fix filtered dummy cards with `getCardRarityByName(name) === 1`, which only keeps cards whose **name** maps to rarity 1 (Рекрут for heroes, Обычный for dragons). But the pack drops **all classes** (Страж, Ветеран, Мифический, etc.) — they should all appear in the roulette.

### Bug 2: Cards display multi-star instead of 1-star
Both `CardPackAnimation` (line 304) and `CardsSummaryGrid` (line 40) use `getCardRarityByName()` to derive star count from the card name. So "Мифический лесной дракон" shows 6 stars, "Защитник" shows 6 stars, etc. But the edge function sets `rarity: 1` for all pack drops — they should all show **1 star**.

### Root cause
`getCardRarityByName` maps card class names to rarity tiers (Мифический=6, Защитник=6), but pack cards always have `rarity: 1`. The display components override the actual rarity with the name-derived one.

---

## Plan

### 1. Fix roulette dummy card generation (`CardPackAnimation.tsx`)
- Remove the `oneStarCards` filter (lines 87-91)
- Use **all cards** from `cardDatabase` for the roulette pool (all classes can appear)
- Set `rarity: 1` on all dummy cards (they represent pack drops)

### 2. Fix star/visual display in roulette (`CardPackAnimation.tsx`)
- Line 304: Change `getCardRarityByName(card.name, card.type, card.rarity)` → use `card.rarity` directly (which is 1 for all pack cards)
- This ensures all cards in the roulette show 1 star and grey rarity borders

### 3. Fix star/visual display in summary grid (`CardsSummaryGrid.tsx`)
- Line 40: Same change — use `card.rarity` instead of `getCardRarityByName()`
- All summary cards will correctly show 1 star

### Technical note
The edge function (`open-card-packs`) already correctly sets `rarity: 1` on all generated cards. No server-side changes needed. The fix is purely in the two client-side display components used during pack opening.

