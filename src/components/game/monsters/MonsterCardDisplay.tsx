import React, { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
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

  const CardContent = () => (
    <Card 
      onClick={onClick}
      variant="menu"
      className={`p-2 transition-all duration-300 h-full hover:scale-105 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}
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
        <h3 className="font-semibold text-white text-[10px] sm:text-xs">
          {name}
        </h3>
        {isBoss && (
          <Badge variant="destructive" className="text-[8px] px-1 py-0 bg-orange-600 border-orange-400">
            Босс
          </Badge>
        )}
      </div>
      
      {description && (
        <p className="text-gray-300 mb-2 text-[10px] sm:text-xs line-clamp-2">
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
        <div className="text-white/80 flex items-center gap-1">
          <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-red-500" />
          {health}
        </div>
        <div className="text-white/80 flex items-center gap-1">
          <Sword className="w-2 h-2 sm:w-3 sm:h-3" />
          {power}
        </div>
      </div>
      
      <div className="mt-auto pt-2 border-t border-white/20">
        <div className="text-white text-[8px] sm:text-[10px] flex items-center gap-1 mb-1">
          <Coins className="w-2 h-2" />
          Дроп:
        </div>
        <div className="text-[8px] space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-300">Монеты</span>
            <span className="text-green-400">{formatDropChance(lootTable.coins.chance)}</span>
          </div>
          {lootTable.healthPotion && (
            <div className="flex justify-between">
              <span className="text-gray-300">Зелье</span>
              <span className="text-green-400">{formatDropChance(lootTable.healthPotion.chance)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const ExpandedCardContent = () => (
    <Card variant="menu" className="p-4 w-80 max-w-sm" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
      {image && (
        <div className="w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden flex items-center justify-center">
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
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-lg">
          {name}
        </h3>
        {isBoss && (
          <Badge variant="destructive" className="text-xs px-2 py-1 bg-orange-600 border-orange-400">
            Босс
          </Badge>
        )}
      </div>
      
      {description && (
        <p className="text-white/90 mb-4 text-sm leading-relaxed">
          {description}
        </p>
      )}
      
      {specialAbilities && specialAbilities.length > 0 && (
        <div className="mb-4">
          <div className="text-purple-400 text-sm font-medium mb-2">
            Способности:
          </div>
          <div className="flex flex-wrap gap-2">
            {specialAbilities.map((ability, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-2 py-1 bg-purple-900/20 text-purple-300 border-purple-400/30"
              >
                {ability.type}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="text-white/80 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="font-medium">{health} HP</span>
        </div>
        <div className="text-white/80 flex items-center gap-2">
          <Sword className="w-4 h-4" />
          <span className="font-medium">{power} ATK</span>
        </div>
      </div>
      
      <div className="pt-3 border-t border-white/20">
        <div className="text-white text-sm flex items-center gap-2 mb-3">
          <Coins className="w-4 h-4" />
          <span className="font-medium">Возможный дроп:</span>
        </div>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-300">Монеты</span>
            <span className="text-green-400 font-medium">{formatDropChance(lootTable.coins.chance)}</span>
          </div>
          {lootTable.healthPotion && (
            <div className="flex justify-between">
              <span className="text-gray-300">Зелье здоровья</span>
              <span className="text-green-400 font-medium">{formatDropChance(lootTable.healthPotion.chance)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (isMobile) {
    return <CardContent />;
  }

  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div>
          <CardContent />
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start"
        className="p-0 border-0 bg-transparent shadow-none z-50"
        sideOffset={10}
      >
        <ExpandedCardContent />
      </HoverCardContent>
    </HoverCard>
  );
});

MonsterCardDisplay.displayName = 'MonsterCardDisplay';