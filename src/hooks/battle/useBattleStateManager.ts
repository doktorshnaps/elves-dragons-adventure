import { useEffect } from 'react';
import { PlayerStats, Opponent } from '@/types/battle';
import { Item } from '@/components/battle/Inventory';

export const useBattleStateManager = (
  playerStats: PlayerStats | null,
  opponents: Opponent[],
  initialState: {
    currentDungeonLevel: number;
    selectedDungeon: string | null;
  },
  inventory: Item[],
  balance: number
) => {
  useEffect(() => {
    if (!playerStats) return;

    const battleState = {
      playerStats,
      opponents,
      currentDungeonLevel: initialState.currentDungeonLevel,
      inventory,
      coins: balance,
      selectedDungeon: initialState.selectedDungeon
    };

    if (playerStats.health > 0) {
      localStorage.setItem('battleState', JSON.stringify(battleState));
    }
  }, [
    playerStats,
    opponents,
    initialState.currentDungeonLevel,
    inventory,
    balance,
    initialState.selectedDungeon
  ]);
};