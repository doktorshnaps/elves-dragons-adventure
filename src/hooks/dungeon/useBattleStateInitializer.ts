import { useToast } from '@/hooks/use-toast';
import { calculateTeamStats } from '@/utils/cardUtils';

export const useBattleStateInitializer = () => {
  const { toast } = useToast();

  const initializeBattleState = (selectedDungeon: string, balance: number) => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);

    const battleState = {
      playerStats: {
        health: teamStats.health,
        maxHealth: teamStats.health,
        power: teamStats.power,
        defense: teamStats.defense
      },
      opponents: [],
      currentDungeonLevel: 1,
      inventory: [],
      coins: balance,
      selectedDungeon
    };

    localStorage.setItem('battleState', JSON.stringify(battleState));
    return battleState;
  };

  return { initializeBattleState };
};