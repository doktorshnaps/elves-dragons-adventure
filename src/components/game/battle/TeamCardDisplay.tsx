import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import { getRarityBorderStyle, getRarityStyle, getCardRarityByName } from "@/utils/rarityColors";

interface TeamCardDisplayProps {
  card: any;
  onClick: () => void;
  isSelected?: boolean;
}

export const TeamCardDisplay = ({ card, onClick, isSelected }: TeamCardDisplayProps) => {
  const stats = useMemo(() => {
    if (card.power === undefined || card.defense === undefined || 
        card.health === undefined || card.magic === undefined) {
      console.error(`❌ [TeamCardDisplay] Card stats missing for ${card.name}!`);
    }
    
    return {
      power: card.power ?? 0,
      defense: card.defense ?? 0,
      health: card.health ?? 0,
      magic: card.magic ?? 0
    };
  }, [card.power, card.defense, card.health, card.magic, card.name]);

  const displayRarity = getCardRarityByName(card.name, card.type, card.rarity);
  const rarityStyle = getRarityStyle(displayRarity);
  const rarityBorder = getRarityBorderStyle(displayRarity);
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:scale-105 ${
        isSelected ? 'ring-2 ring-game-accent' : ''
      } ${rarityStyle.shimmer ? (displayRarity === 9 ? 'rarity-shimmer rarity-diamond' : 'rarity-shimmer') : ''}`}
      onClick={onClick}
      style={rarityBorder}
    >
      <CardContent className="p-3">
        <div className="text-center">
          <div className="font-bold text-white mb-1">{card.name}</div>
          
          <div className="mb-2">
            <div className="text-xs text-white/70 mb-1">
              Здоровье: {card.currentHealth || stats.health}/{stats.health}
            </div>
            <Progress 
              value={((card.currentHealth || stats.health) / stats.health) * 100} 
              className="h-2"
            />
          </div>

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
