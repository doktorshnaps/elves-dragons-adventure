import { calculateTeamStats } from '@/utils/cardUtils';

export const useInitialBattleState = (initialLevel: number = 1) => {
  const savedState = localStorage.getItem('battleState');
  
  if (savedState) {
    return JSON.parse(savedState);
  }
  
  const savedCards = localStorage.getItem('gameCards');
  const cards = savedCards ? JSON.parse(savedCards) : [];
  const teamStats = calculateTeamStats(cards);
  
  return {
    playerStats: {
      health: teamStats.health,
      maxHealth: teamStats.maxHealth,
      power: teamStats.power,
      defense: teamStats.defense
    },
    currentDungeonLevel: initialLevel,
    selectedDungeon: null
  };
};