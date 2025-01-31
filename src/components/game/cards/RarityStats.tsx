import { Rarity } from "@/types/cards";
import { getStatsForRarity } from "@/utils/cardUtils";

interface RarityStatsProps {
  baseStats: any;
}

export const RarityStats = ({ baseStats }: RarityStatsProps) => {
  const rarityLevels: Rarity[] = [1, 2, 3, 4, 5, 6, 7, 8];
  
  return (
    <div className="space-y-2">
      {rarityLevels.map((rarity) => {
        const stats = getStatsForRarity(rarity);
        return (
          <div key={rarity} className="text-xs">
            <div className="font-semibold text-yellow-500 mb-1">
              {"⭐".repeat(rarity)}
            </div>
            <div className="grid grid-cols-2 gap-x-2 text-gray-300">
              <div>Сила: {stats.power}</div>
              <div>Защита: {stats.defense}</div>
              <div>Здоровье: {stats.health}</div>
              <div>Магия: {stats.magic}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};