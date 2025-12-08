import React, { memo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Sword, Shield, Skull, Coins } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateLootTable, formatDropChance } from "@/utils/lootUtils";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface MonsterCardDisplayProps {
  name: string;
  health: number;
  power: number;
  armor?: number;
  isBoss?: boolean;
  isMiniboss?: boolean;
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
  armor,
  isBoss,
  isMiniboss,
  image,
  specialAbilities,
  description,
  className = "",
  onClick
}: MonsterCardDisplayProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
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
          {image ? (
            <OptimizedImage
              src={image}
              alt={name}
              width={240}
              height={320}
              placeholder="/placeholder.svg"
              className="w-full h-full object-cover"
              progressive={true}
            />
          ) : (
            <img src="/placeholder.svg" alt={name} className="w-full h-full object-cover" />
          )}
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
        {isMiniboss && !isBoss && (
          <Badge variant="destructive" className="text-[8px] px-1 py-0 bg-yellow-600 border-yellow-400">
            Мини-босс
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
      
      <div className="grid grid-cols-3 gap-1 text-[10px] sm:text-xs">
        <div className="text-white/80 flex items-center gap-1">
          <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-red-500" />
          {health}
        </div>
        <div className="text-white/80 flex items-center gap-1">
          <Sword className="w-2 h-2 sm:w-3 sm:h-3 text-orange-400" />
          {power}
        </div>
        <div className="text-white/80 flex items-center gap-1">
          <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-blue-400" />
          {armor || 0}
        </div>
      </div>
    </Card>
  );

  const ExpandedCardContent = () => (
    <Card variant="menu" className="p-4 w-80 max-w-sm" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
      {image && (
        <div className="w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden flex items-center justify-center">
        {image ? (
          <OptimizedImage
            src={image}
            alt={name}
            width={320}
            height={427}
            placeholder="/placeholder.svg"
            className="w-full h-full object-cover"
            progressive={true}
          />
        ) : (
          <img src="/placeholder.svg" alt={name} className="w-full h-full object-cover" />
        )}
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
      
      <div className="grid grid-cols-3 gap-3 text-sm mb-4">
        <div className="text-white/80 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="font-medium">{health} HP</span>
        </div>
        <div className="text-white/80 flex items-center gap-2">
          <Sword className="w-4 h-4 text-orange-400" />
          <span className="font-medium">{power} ATK</span>
        </div>
        <div className="text-white/80 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="font-medium">{armor || 0} DEF</span>
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
        </div>
      </div>
    </Card>
  );

  if (isMobile) {
    return <CardContent />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div>
          <CardContent />
        </div>
      </DialogTrigger>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-fit">
        <ExpandedCardContent />
      </DialogContent>
    </Dialog>
  );
});

MonsterCardDisplay.displayName = 'MonsterCardDisplay';