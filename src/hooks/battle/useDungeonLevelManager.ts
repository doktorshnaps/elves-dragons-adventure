import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PlayerStats } from '@/types/battle';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';

export const useDungeonLevelManager = (
  playerStats: PlayerStats | null,
  initialState: {
    currentDungeonLevel: number;
    selectedDungeon: string | null;
  },
  setOpponents: (opponents: any[]) => void
) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNextLevel = () => {
    if (!playerStats || playerStats.health <= 0) return;

    const nextLevel = initialState.currentDungeonLevel + 1;
    const selectedDungeon = initialState.selectedDungeon;
    
    if (!selectedDungeon) {
      toast({
        title: "Ошибка",
        description: "Подземелье не выбрано",
        variant: "destructive"
      });
      return;
    }
    
    const newOpponents = generateDungeonOpponents(selectedDungeon, nextLevel);
    setOpponents(newOpponents);
    
    const battleState = {
      playerStats: {
        ...playerStats
      },
      opponents: newOpponents,
      currentDungeonLevel: nextLevel,
      selectedDungeon
    };
    localStorage.setItem('battleState', JSON.stringify(battleState));
    
    toast({
      title: "Переход на следующий уровень",
      description: `Вы переходите на уровень ${nextLevel}`,
      duration: 2000
    });

    navigate(`/battle?level=${nextLevel}`, { replace: true });
  };

  return { handleNextLevel };
};