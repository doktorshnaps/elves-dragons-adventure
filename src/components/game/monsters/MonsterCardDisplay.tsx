import React, { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Sword, Shield, Skull, Coins } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateLootTable, formatDropChance } from "@/utils/lootUtils";

interface MonsterCardDisplayProps {
  name: string;
  health: number;
  power: number;
  isBoss?: boolean;
  image?: string;
  specialAbilities?: any[];
  description?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const MonsterCardDisplay = memo(({
  name,
  health,
  power,
  isBoss,
  image,
  specialAbilities,
  description,
  className = "",
  onClick
}: MonsterCardDisplayProps) => {
  const isMobile = useIsMobile();
  const lootTable = generateLootTable(isBoss || false);

  return (
    <Card 
      onClick={onClick} 
      className={`p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {image && (
        <div className="w-full aspect-[3/4] mb-2 rounded-lg overflow-hidden flex items-center justify-center">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      )}
      
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-game-accent text-[10px] sm:text-xs">
          {name}
        </h3>
        {isBoss && (
          <Badge variant="destructive" className="text-[8px] px-1 py-0 bg-orange-600 border-orange-400">
            Босс
          </Badge>
        )}
      </div>
      
      {description && (
        <p className="text-gray-400 mb-2 text-[10px] sm:text-xs line-clamp-2">
          {description}
        </p>
      )}
      
      {specialAbilities && specialAbilities.length > 0 && (
        <div className="mb-2">
          <div className="text-purple-400 text-[8px] sm:text-[10px] mb-1">
            Способности:
          </div>
          <div className="flex flex-wrap gap-1">
            {specialAbilities.slice(0, 2).map((ability, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-[6px] px-1 py-0 bg-purple-900/20 text-purple-300 border-purple-400/30"
              >
                {ability.type}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs mb-2">
        <div className="text-game-secondary flex items-center gap-1">
          <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-red-500" />
          {health}
        </div>
        <div className="text-game-secondary flex items-center gap-1">
          <Sword className="w-2 h-2 sm:w-3 sm:h-3" />
          {power}
        </div>
      </div>
      
      <div className="mt-auto pt-2 border-t border-game-accent/20">
        <div className="text-game-accent text-[8px] sm:text-[10px] flex items-center gap-1 mb-1">
          <Coins className="w-2 h-2" />
          Дроп:
        </div>
        <div className="text-[8px] space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-400">Монеты</span>
            <span className="text-green-400">{formatDropChance(lootTable.coins.chance)}</span>
          </div>
          {lootTable.healthPotion && (
            <div className="flex justify-between">
              <span className="text-gray-400">Зелье</span>
              <span className="text-green-400">{formatDropChance(lootTable.healthPotion.chance)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

MonsterCardDisplay.displayName = 'MonsterCardDisplay';