

## Redesign: Team Selection Panel inspired by RPG Party View

### What the reference image shows
The uploaded screenshot shows a classic RPG team lobby: 5 character portraits displayed **side by side horizontally** with large character art, player names below, and a combat power stat. Clean, visually prominent character art is the focus, with minimal UI clutter.

### Current state
The `/team` page displays selected pairs in a grid of 5 slots, each containing small `CardDisplay` components (~90-140px wide) showing hero + dragon side by side with full stat blocks, health bars, rarity labels, faction info, etc. It's functional but information-dense and visually cluttered compared to the reference.

### Proposed redesign: "Party Lineup" view for the selected team section

Restyle the **"Выбранная команда" section** (lines 262-326 of `DeckSelection.tsx`) to resemble the reference while keeping our dark fantasy aesthetic:

1. **Horizontal hero lineup** -- Display 5 slots in a single horizontal row (already `lg:grid-cols-5`), but make each slot a **portrait-focused card**:
   - Large character image taking ~70% of the card height
   - Hero name prominently below the portrait
   - Compact power indicator (single combined stat icon + number, like the reference's crossed-swords + value)
   - Dragon shown as a **small badge/overlay** in the corner of the hero portrait (not a separate equal-sized card)

2. **Slot design**:
   - Empty slots: a translucent silhouette placeholder with "+" icon (instead of current dashed border box)
   - Filled slots: character art fills the card, with a subtle gradient overlay at the bottom for the name/stats
   - Rarity border glow preserved (existing `rarityBorder` system)

3. **Dragon indicator** (replaces current side-by-side layout):
   - Small circular dragon avatar (~24-32px) positioned at bottom-right of the hero card
   - If no dragon assigned, show a small "+" circle there
   - Clicking the dragon badge opens the dragon deck dialog (existing flow)

4. **Stat display simplification**:
   - Show only **one combined power number** (sum of power + magic, or just power) under the name
   - Full stats remain visible on tap/click via the existing `CardPreviewModal`

### Files to modify

| File | Changes |
|------|---------|
| `src/components/game/team/DeckSelection.tsx` | Restyle the "Selected Pairs Display" section (lines 262-326). Replace the current grid-cols-2 hero/dragon layout per slot with a portrait-focused card. Dragon becomes a corner badge overlay. |
| `src/components/game/cards/CardImage.tsx` | May need a variant prop for larger portrait display |
| Possibly new: `src/components/game/team/TeamSlotCard.tsx` | Extract the new slot design into its own component for cleanliness |

### What stays the same
- All selection logic, pair management, dragon assignment flow
- Deck dialogs (hero picker, dragon picker)
- CardPreviewModal on click
- Team stats section below
- Dark fantasy color scheme, rarity borders, shimmer effects

### Visual layout sketch

```text
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│         │ │         │ │         │ │         │ │         │
│  Hero   │ │  Hero   │ │  Hero   │ │   +     │ │   +     │
│  Art    │ │  Art    │ │  Art    │ │  Empty  │ │  Empty  │
│         │ │      🐉 │ │      🐉 │ │  Slot   │ │  Slot   │
│─────────│ │─────────│ │─────────│ │         │ │         │
│ Name    │ │ Name    │ │ Name    │ │         │ │         │
│ ⚔ 1250  │ │ ⚔ 980   │ │ ⚔ 1100  │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

The dragon badge (🐉) is a small circular overlay; clicking it opens dragon selection. Clicking the hero opens preview. A small "X" or swipe gesture removes the pair.

