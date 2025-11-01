import { Button } from "@/components/ui/button";
import { useEggIncubation } from "@/hooks/useEggIncubation";
import { formatTime } from "@/utils/timeUtils";
import { Rarity } from "@/types/cards";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

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
  const { language } = useLanguage();
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

  // Если нет createdAt, значит инкубация не началась
  if (!createdAt) {
    return (
      <Button 
        onClick={() => {
          // Эмитируем событие для начала инкубации через контекст
          const event = new CustomEvent('startIncubation', { 
            detail: { petName, rarity }
          });
          window.dispatchEvent(event);
        }}
        className="mt-1 text-[8px] sm:text-[10px] md:text-[12px] px-2 py-1 rounded bg-game-primary/80 hover:bg-game-primary text-white hover-scale"
      >
        {t(language, 'dragonEgg.startIncubation')}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {isStarted && !isHatched && (
        <div className="text-center">
          <div className="text-[6px] sm:text-[8px] md:text-[10px] text-gray-400">{t(language, 'dragonEgg.timeUntilHatch')}</div>
          <div className="text-[8px] sm:text-[10px] md:text-[12px] font-bold text-game-accent">
            {formatTime(timeLeft || 0)}
          </div>
        </div>
      )}

      {canClaim && (
        <Button 
          onClick={handleClaim}
          className="bg-game-primary hover:bg-game-primary/80 text-[8px] sm:text-[10px] md:text-[12px] px-2 py-1"
        >
          {t(language, 'dragonEgg.claim')}
        </Button>
      )}

      {isHatched && !canClaim && (
        <div className="text-center text-green-500 text-[8px] sm:text-[10px] md:text-[12px]">
          {t(language, 'dragonEgg.claimed')}
        </div>
      )}
    </div>
  );
};