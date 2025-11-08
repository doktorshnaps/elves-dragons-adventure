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
    <div className="flex justify-between items-start gap-0.5 px-0.5 min-w-0">
      <h3 className={`font-semibold text-white tracking-tighter leading-none truncate flex-1 min-w-0 ${isMobile ? 'text-[7px]' : 'text-[11px]'}`}>
        {name}
      </h3>
      <span className={`text-white leading-none flex-shrink-0 min-w-0 max-w-[48%] truncate ${isMobile ? 'text-[7px]' : 'text-[11px]'}`}>
        {getRarityLabel(rarity)}
      </span>
    </div>
  );
};