import { useToast } from '@/hooks/use-toast';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { calculateTeamStats } from '@/utils/cardUtils';
import { DungeonType } from '@/constants/dungeons';

export const useBattleStateInitializer = () => {
  const { toast } = useToast();

  const initializeBattleState = async (selectedDungeon: DungeonType, balance: number) => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);

    const opponents = await generateDungeonOpponents(selectedDungeon, 1);

    const battleState = {
      playerStats: {
        health: teamStats.health,
        maxHealth: teamStats.maxHealth,
        power: teamStats.power,
        defense: teamStats.defense
      },
      opponents,
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