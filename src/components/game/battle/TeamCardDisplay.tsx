import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TeamCard } from "@/hooks/useAbilities";
import { calculateCardStats } from "@/utils/cardUtils";
import { useMemo } from "react";

interface TeamCardDisplayProps {
  card: TeamCard;
  onClick: () => void;
  isSelected?: boolean;
}

export const TeamCardDisplay = ({ card, onClick, isSelected }: TeamCardDisplayProps) => {
  const hasAbilities = card.abilities.length > 0;
  
  // Пересчитываем характеристики с учётом класса и редкости
  const stats = useMemo(() => 
    calculateCardStats(card.name, card.rarity, card.type), 
    [card.name, card.rarity, card.type]
  );
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:scale-105 ${
        isSelected ? 'ring-2 ring-game-accent' : ''
      } ${hasAbilities ? 'border-blue-400' : 'border-game-accent'}`}
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

          {/* Мана (только для героев со способностями) */}
          {hasAbilities && (
            <div className="mb-2">
              <div className="text-xs text-blue-400 mb-1">
                Мана: {card.currentMana}/{card.maxMana}
              </div>
              <Progress 
                value={(card.currentMana / card.maxMana) * 100} 
                className="h-2"
              />
            </div>
          )}

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

          {/* Индикатор способностей */}
          {hasAbilities && (
            <div className="mt-2 text-xs text-blue-400">
              🔮 Способности: {card.abilities.length}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};