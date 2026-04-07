

# Quick Skip Level for Golden Ticket NFT Holders

## What it does

Players who own an NFT from the `golden_ticket.nfts.tg` contract get a "Quick Battle" button during dungeon fights. Instead of watching the full turn-by-turn combat, they see a short loading animation (~2 seconds) while the battle is resolved instantly in the background. After that, the normal reward modal appears (continue or exit).

## How it works

The quick skip simulates the entire battle using the same dice formula (`calculateDiceDamage`, D6 rolls) but without delays or animations. Player pairs attack opponents sequentially (focus-fire), enemies attack random pairs — identical logic to the existing auto-battle, just instant.

## Changes

### 1. New hook: `src/hooks/useGoldenTicketCheck.ts`

- Queries `user_nft_cards` table filtered by `wallet_address = accountId` and `nft_contract_id = 'golden_ticket.nfts.tg'`
- Returns `{ hasGoldenTicket: boolean, isLoading: boolean }`
- Uses React Query with 5-minute stale time (cheap check, cached)

### 2. New utility: `src/utils/quickBattleSimulator.ts`

- Pure function: `simulateQuickBattle(playerPairs, opponents, attackOrder)` → `{ resultPairs, resultOpponents, isVictory }`
- Runs the full battle loop synchronously:
  - Player pairs attack in `attackOrder` sequence, targeting first alive opponent (focus-fire)
  - Enemies attack random alive player pairs
  - Uses `calculateDiceDamage` with random D6 rolls (no pity tracker needed for speed)
  - `applyDamageToPair`-equivalent logic applied inline (dragon absorbs first, then hero)
  - Loop ends when all opponents dead (victory) or all player pairs dead (defeat)
- Returns final HP/defense state for all pairs and opponents

### 3. Modified: `src/components/game/battle/TeamBattlePage.tsx`

- Import `useGoldenTicketCheck` and `simulateQuickBattle`
- Add state: `quickBattleInProgress: boolean`
- Add handler `handleQuickBattle`:
  1. Set `quickBattleInProgress = true`
  2. Run `simulateQuickBattle(battleState.playerPairs, battleState.opponents, attackOrder)`
  3. Update `battleState` with results (setBattleState with final HP values)
  4. Track killed monsters in `monstersKilledRef`
  5. Wait 1.5s (animated loading bar) then set `quickBattleInProgress = false`
  6. The existing `isBattleOver` effect picks up and shows reward modal
- Render: When `quickBattleInProgress` is true, show a full-screen overlay with animated progress bar and text "Идёт бой..."

### 4. Modified: `src/components/game/battle/TeamBattleArena.tsx`

- Accept new prop `onQuickBattle?: () => void` and `hasGoldenTicket?: boolean`
- Show a ⚡ "Быстрый бой" button in the battle header (next to speed controls) when `hasGoldenTicket` is true
- Button calls `onQuickBattle`

### Files

- `src/hooks/useGoldenTicketCheck.ts` — new, NFT ownership check
- `src/utils/quickBattleSimulator.ts` — new, instant battle simulation
- `src/components/game/battle/TeamBattlePage.tsx` — add quick battle handler + loading overlay
- `src/components/game/battle/TeamBattleArena.tsx` — add quick battle button

