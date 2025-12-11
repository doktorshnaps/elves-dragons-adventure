import { useIsMobile } from "@/hooks/use-mobile";
import { getRarityLabel } from "@/utils/cardUtils";
import { Rarity } from "@/types/cards";

interface CardHeaderProps {
  name: string;
  rarity: Rarity;
  elementEmoji?: string;
}

export const CardHeader = ({ name, rarity, elementEmoji }: CardHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-0 px-0.5 min-w-0">
      <div className="flex items-center gap-0.5">
        {elementEmoji && (
          <span className={`flex-shrink-0 ${isMobile ? 'text-[8px]' : 'text-[12px]'}`}>
            {elementEmoji}
          </span>
        )}
        <h3 className={`font-semibold text-white tracking-tighter leading-tight line-clamp-2 flex-1 min-w-0 ${isMobile ? 'text-[6px]' : 'text-[10px]'}`}>
          {name}
        </h3>
      </div>
      <span className={`text-yellow-400 leading-none ${isMobile ? 'text-[6px]' : 'text-[9px]'}`}>
        {getRarityLabel(rarity)}
      </span>
    </div>
  );
};