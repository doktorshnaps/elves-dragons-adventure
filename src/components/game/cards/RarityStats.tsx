import { Rarity } from "@/types/cards";
import { calculateCardStats } from "@/utils/cardUtils";

interface RarityStatsProps {
  cardName: string;
  cardType?: 'character' | 'pet';
}

export const RarityStats = ({ cardName, cardType = 'character' }: RarityStatsProps) => {
  const rarityLevels: Rarity[] = [1, 2, 3, 4, 5, 6, 7, 8];
  
  return (
    <div className="space-y-2">
      {rarityLevels.map((rarity) => {
        // Используем новую систему расчета характеристик с учетом типа
        const stats = calculateCardStats(cardName, rarity, cardType);
        
        return (
          <div key={rarity} className="text-xs">
            <div className="font-semibold text-yellow-500 mb-1">
              {"⭐".repeat(rarity)}
            </div>
            <div className="grid grid-cols-2 gap-x-2 text-gray-300">
              <div>Атака: {stats.power}</div>
              <div>Броня: {stats.defense}</div>
              <div>Здоровье: {stats.health}</div>
              <div>Магия: {stats.magic}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};