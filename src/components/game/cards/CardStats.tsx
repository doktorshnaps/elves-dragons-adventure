import { useIsMobile } from "@/hooks/use-mobile";
import { Heart, Shield, Sword } from "lucide-react";

interface CardStatsProps {
  health: number;
  power: number;
  defense: number;
}

export const CardStats = ({ health, power, defense }: CardStatsProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={`grid grid-cols-2 gap-0.5 px-0.5 ${isMobile ? 'text-[6px]' : 'text-xs'} text-white mt-0.5`}>
      <div className="flex items-center gap-0.5">
        <Heart className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} text-white flex-shrink-0`} />
        <span>{health}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <Sword className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} text-white flex-shrink-0`} />
        <span>{power}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <Shield className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} text-white flex-shrink-0`} />
        <span>{defense}</span>
      </div>
    </div>
  );
};