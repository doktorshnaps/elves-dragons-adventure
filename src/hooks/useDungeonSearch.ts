import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { useEnergy } from "@/utils/energyManager";
import { useEnergyManagement } from "./dungeon/useEnergyManagement";
import { useDungeonSelection } from "./dungeon/useDungeonSelection";
import { useHealthCheck } from "./dungeon/useHealthCheck";
import { useBattleStateInitializer } from "./dungeon/useBattleStateInitializer";

export const useDungeonSearch = (balance: number) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { energyState, timeUntilNext } = useEnergyManagement();
  const { rolling, selectedDungeon, startRolling, stopRolling, setSelectedDungeon } = useDungeonSelection();
  const { isHealthTooLow } = useHealthCheck();
  const { initializeBattleState } = useBattleStateInitializer();

  const rollDice = () => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState.playerStats.health > 0) {
        toast({
          title: "У вас уже есть активное подземелье",
          description: "Завершите текущее подземелье или погибните, чтобы начать новое",
          variant: "destructive",
        });
        return;
      } else {
        localStorage.removeItem('battleState');
      }
    }

    if (!useEnergy()) {
      toast({
        title: "Недостаточно энергии",
        description: "Подождите пока энергия восстановится",
        variant: "destructive",
      });
      return;
    }

    if (isHealthTooLow) {
      toast({
        title: "Низкое здоровье",
        description: "Подождите пока здоровье восстановится до 20% от максимума",
        variant: "destructive",
      });
      return;
    }

    const { interval, selectFinalDungeon } = startRolling();

    setTimeout(() => {
      clearInterval(interval);
      const finalDungeon = selectFinalDungeon();
      setSelectedDungeon(finalDungeon);
      stopRolling();

      try {
        const battleState = initializeBattleState(finalDungeon, balance);
        console.log("Initialized battle state:", battleState);
        
        toast({
          title: "Подземелье найдено!",
          description: `Вы входите в ${finalDungeon}`,
        });

        setTimeout(() => {
          navigate("/battle");
        }, 2000);
      } catch (error) {
        console.error("Error initializing battle state:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось инициализировать подземелье. Попробуйте еще раз.",
          variant: "destructive",
        });
      }
    }, 2000);
  };

  return {
    rolling,
    selectedDungeon,
    energyState,
    timeUntilNext,
    isHealthTooLow,
    rollDice
  };
};