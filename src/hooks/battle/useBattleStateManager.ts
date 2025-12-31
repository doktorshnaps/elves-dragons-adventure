import { useEffect } from 'react';
import { PlayerStats, Opponent } from '@/types/battle';
import { Item } from "@/types/inventory";
import { useGameStore } from '@/stores/gameStore';

/**
 * РЕФАКТОРИНГ: Убрана запись battleState в localStorage
 * Теперь состояние боя хранится только в памяти (Zustand)
 * Это предотвращает рассинхронизацию и security warnings
 */
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
  const setBattleState = useGameStore((state) => state.setBattleState);
  
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

    // Сохраняем состояние боя только в Zustand (в памяти)
    // НЕ в localStorage - это предотвращает security warnings и рассинхронизацию
    if (playerStats.health > 0) {
      setBattleState(battleState);
    }
  }, [
    playerStats,
    opponents,
    initialState.currentDungeonLevel,
    inventory,
    balance,
    initialState.selectedDungeon,
    setBattleState
  ]);
};
