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
      <h3 className={`font-semibold text-game-accent break-words tracking-tighter leading-none ${isMobile ? 'text-[8px]' : 'text-[11px]'}`}>
        {name}
      </h3>
      <span className={`text-yellow-500 whitespace-nowrap leading-none ${isMobile ? 'text-[8px]' : 'text-[11px]'}`}>
        {getRarityLabel(rarity)}
      </span>
    </div>
  );
};