import { calculateTeamStats } from '@/utils/cardUtils';

/**
 * Инициализация начального состояния боя
 * ВАЖНО: battleState больше НЕ сохраняется в localStorage
 * Он управляется через React state в useTeamBattle
 */
export const useInitialBattleState = (initialLevel: number = 1) => {
  // Возвращаем пустое начальное состояние
  // Реальные данные загружаются из card_instances через useTeamBattle
  return {
    playerStats: {
      health: 0,
      maxHealth: 0,
      power: 0,
      defense: 0
    },
    currentDungeonLevel: initialLevel,
    selectedDungeon: null
  };
};