import { Button } from "@/components/ui/button";
import { useEggIncubation } from "@/hooks/useEggIncubation";
import { formatTime } from "@/utils/timeUtils";
import { Rarity } from "@/types/cards";

interface DragonEggTimerProps {
  petName: string;
  createdAt: string;
  rarity: Rarity;
  onHatch: () => void;
}

export const DragonEggTimer = ({ 
  petName, 
  createdAt, 
  rarity, 
  onHatch 
}: DragonEggTimerProps) => {
  const {
    isStarted,
    isHatched,
    canClaim,
    timeLeft,
    handleStart,
    handleClaim
  } = useEggIncubation({
    petName,
    createdAt,
    rarity,
    onHatch
  });

  return (
    <div className="flex flex-col gap-2">
      {!isStarted && (
        <Button 
          onClick={handleStart}
          className="bg-game-accent hover:bg-game-accent/80"
        >
          Начать инкубацию
        </Button>
      )}

      {isStarted && !isHatched && (
        <div className="text-center">
          <div className="text-sm text-gray-400">До вылупления:</div>
          <div className="text-xl font-bold text-game-accent">
            {formatTime(timeLeft || 0)}
          </div>
        </div>
      )}

      {canClaim && (
        <Button 
          onClick={handleClaim}
          className="bg-game-primary hover:bg-game-primary/80 text-xs sm:text-sm px-1 py-1"
        >
          Получить
        </Button>
      )}

      {isHatched && !canClaim && (
        <div className="text-center text-green-500">
          Питомец получен!
        </div>
      )}
    </div>
  );
};