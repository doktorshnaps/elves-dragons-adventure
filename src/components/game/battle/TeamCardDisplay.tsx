import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

interface TeamCardDisplayProps {
  card: any;
  onClick: () => void;
  isSelected?: boolean;
}

export const TeamCardDisplay = ({ card, onClick, isSelected }: TeamCardDisplayProps) => {
  // Используем сохраненные характеристики из card_data, пересчет только как fallback
  const stats = useMemo(() => {
    // КРИТИЧНО: характеристики ВСЕГДА должны быть в объекте карты из card_instances
    if (card.power === undefined || card.defense === undefined || 
        card.health === undefined || card.magic === undefined) {
      console.error(`❌ [TeamCardDisplay] Card stats missing for ${card.name}! This should never happen - card data must come from card_instances context.`);
    }
    
    return {
      power: card.power ?? 0,
      defense: card.defense ?? 0,
      health: card.health ?? 0,
      magic: card.magic ?? 0
    };
  }, [card.power, card.defense, card.health, card.magic, card.name]);
  
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
