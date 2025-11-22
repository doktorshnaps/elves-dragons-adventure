import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculateCardStats } from "@/utils/cardUtils";
import { useMemo } from "react";

interface TeamCardDisplayProps {
  card: any;
  onClick: () => void;
  isSelected?: boolean;
}

export const TeamCardDisplay = ({ card, onClick, isSelected }: TeamCardDisplayProps) => {
  // Используем сохраненные характеристики из card_data, пересчет только как fallback
  const stats = useMemo(() => {
    // Если характеристики уже есть в объекте карты, используем их
    if (card.power !== undefined && card.defense !== undefined && 
        card.health !== undefined && card.magic !== undefined) {
      return {
        power: card.power,
        defense: card.defense,
        health: card.health,
        magic: card.magic
      };
    }
    
    // Иначе пересчитываем (fallback для старых карт)
    console.warn(`⚠️ Team card stats not found in card_data for ${card.name}, recalculating...`);
    return calculateCardStats(card.name, card.rarity, card.type);
  }, [card.name, card.rarity, card.type, card.power, card.defense, card.health, card.magic]);
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:scale-105 ${
        isSelected ? 'ring-2 ring-game-accent' : ''
      } border-game-accent`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="text-center">
          <div className="font-bold text-game-accent mb-1">{card.name}</div>
          
          {/* Здоровье */}
          <div className="mb-2">
            <div className="text-xs text-game-text mb-1">
              Здоровье: {card.currentHealth || stats.health}/{stats.health}
            </div>
            <Progress 
              value={((card.currentHealth || stats.health) / stats.health) * 100} 
              className="h-2"
            />
          </div>

          {/* Статистики */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-red-400">
              <div>⚔️</div>
              <div>{stats.power}</div>
            </div>
            <div className="text-blue-400">
              <div>🛡️</div>
              <div>{stats.defense}</div>
            </div>
            <div className="text-purple-400">
              <div>✨</div>
              <div>{stats.magic}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
