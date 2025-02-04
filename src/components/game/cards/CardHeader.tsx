import { useIsMobile } from "@/hooks/use-mobile";
import { getRarityLabel } from "@/utils/cardUtils";
import { Rarity } from "@/types/cards";

interface CardHeaderProps {
  name: string;
  rarity: Rarity;
}

export const CardHeader = ({ name, rarity }: CardHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex justify-between items-start gap-0.5 px-0.5">
      <h3 className={`font-semibold text-game-accent break-words ${isMobile ? 'text-[8px]' : 'text-xs'} leading-tight`}>
        {name}
      </h3>
      <span className={`text-yellow-500 whitespace-nowrap ${isMobile ? 'text-[8px]' : 'text-xs'}`}>
        {getRarityLabel(rarity)}
      </span>
    </div>
  );
};