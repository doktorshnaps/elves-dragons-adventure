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

export const MonsterCardDisplay = ({
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
      className={`relative w-[90px] h-[180px] sm:w-[120px] sm:h-[240px] md:w-[130px] md:h-[260px] lg:w-[140px] lg:h-[280px]
        p-0.5 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 
        ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex flex-col h-full">
        {/* Monster Image */}
        <div className="w-full h-[75px] sm:h-[100px] md:h-[110px] lg:h-[120px] flex-shrink-0">
          {image ? (
            <div className="w-full h-full overflow-hidden rounded-lg">
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
          ) : (
            <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
              <Skull className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex flex-col flex-grow justify-between gap-0 p-0.5 h-[105px] sm:h-[140px] md:h-[150px] lg:h-[160px]">
          <div className="flex flex-col gap-0">
            {/* Monster Header */}
            <div className="flex justify-between items-start gap-0.5 px-0.5">
              <h3 className={`font-semibold text-game-accent break-words tracking-tighter leading-none ${isMobile ? 'text-[7px]' : 'text-[11px]'}`}>
                {name}
              </h3>
              {isBoss && (
                <Badge variant="destructive" className={`${isMobile ? 'text-[6px] px-1 py-0' : 'text-[8px] px-1 py-0'} bg-orange-600 border-orange-400`}>
                  Босс
                </Badge>
              )}
            </div>

            <div className={`text-purple-400 leading-none px-0.5 ${isMobile ? 'text-[6px]' : 'text-[10px]'}`}>
              (Монстр)
            </div>

            {/* Monster Stats */}
            <div className={`grid grid-cols-2 gap-0.5 px-0.5 ${isMobile ? 'text-[6px]' : 'text-xs'} text-gray-400 mt-0.5`}>
              <div className="flex items-center gap-0.5">
                <Heart className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} text-red-500 flex-shrink-0`} />
                <span>{health}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Sword className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} flex-shrink-0`} />
                <span>{power}</span>
              </div>
            </div>

            {/* Special Abilities */}
            {specialAbilities && specialAbilities.length > 0 && (
              <div className="px-0.5 mt-0.5">
                <div className={`text-purple-400 leading-none ${isMobile ? 'text-[6px]' : 'text-[8px]'} mb-0.5`}>
                  Способности:
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {specialAbilities.slice(0, 2).map((ability, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className={`${isMobile ? 'text-[5px] px-0.5 py-0' : 'text-[6px] px-0.5 py-0'} bg-purple-900/20 text-purple-300 border-purple-400/30`}
                    >
                      {ability.type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description (truncated for card) */}
            {description && (
              <div className={`text-game-text/80 leading-tight px-0.5 mt-0.5 ${isMobile ? 'text-[5px]' : 'text-[7px]'} line-clamp-2`}>
                {description.length > 60 ? `${description.substring(0, 60)}...` : description}
              </div>
            )}
          </div>

          {/* Loot Information */}
          <div className="mt-auto px-0.5">
            <div className={`text-game-accent leading-none flex items-center gap-0.5 ${isMobile ? 'text-[6px]' : 'text-[8px]'} mb-0.5`}>
              <Coins className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
              Дроп:
            </div>
            <div className={`space-y-0.5 ${isMobile ? 'text-[5px]' : 'text-[6px]'}`}>
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
        </div>
      </div>
    </Card>
  );
};