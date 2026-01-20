import { useToast } from '@/hooks/use-toast';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { calculateTeamStats } from '@/utils/cardUtils';
import { DungeonType } from '@/constants/dungeons';
import { useGameStore } from '@/stores/gameStore';

/**
 * РЕФАКТОРИНГ: Убрана запись в localStorage
 * Состояние боя сохраняется только в Zustand
 */
export const useBattleStateInitializer = () => {
  const { toast } = useToast();
  const setBattleState = useGameStore((state) => state.setBattleState);

  const initializeBattleState = async (selectedDungeon: DungeonType, balance: number) => {
    // Получаем карты из Zustand selectedTeam
    const selectedTeam = useGameStore.getState().selectedTeam || [];
    const cards = selectedTeam.map((pair: any) => pair.hero).filter(Boolean);
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

    // Сохраняем только в Zustand (не в localStorage)
    setBattleState(battleState);
    
    return battleState;
  };

  return { initializeBattleState };
};
