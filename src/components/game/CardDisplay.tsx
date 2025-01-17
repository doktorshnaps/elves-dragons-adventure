import { Card as CardType } from "@/types/cards";
import { getRarityLabel, getCardPrice } from "@/utils/cardUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Coins, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface CardDisplayProps {
  card: CardType;
  showSellButton?: boolean;
  onSell?: (card: CardType) => void;
  className?: string;
}

export const CardDisplay = ({ card, showSellButton, onSell, className = "" }: CardDisplayProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className={`p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full ${className}`}>
      <div className="flex flex-col gap-1">
        {card.image && (
          <div className="w-full aspect-square mb-1 rounded-lg overflow-hidden">
            <img 
              src={card.image} 
              alt={card.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <h3 className={`font-semibold text-game-accent ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
            {card.name} ({card.type === 'character' ? 'Герой' : 'Питомец'})
          </h3>
          <span className={`text-yellow-500 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            {getRarityLabel(card.rarity)}
          </span>
        </div>

        {card.faction && (
          <div className={`flex items-center gap-1 ${isMobile ? 'text-[10px]' : 'text-xs'} text-purple-400`}>
            <Sparkles className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span>{card.faction}</span>
          </div>
        )}
        
        <div className={`flex gap-3 ${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-400`}>
          <div className="flex items-center gap-1">
            <Heart className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-red-500`} />
            <span>{card.health}</span>
          </div>
          <div className="flex items-center gap-1">
            <Sword className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span>{card.power}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span>{card.defense}</span>
          </div>
        </div>

        {card.magicResistance && (
          <div className={`text-blue-400 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            Защита от {card.magicResistance.type} магии: {card.magicResistance.value}%
          </div>
        )}

        {showSellButton && (
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="mt-auto text-yellow-500 hover:text-yellow-600 text-[10px]"
            onClick={() => onSell?.(card)}
          >
            <Coins className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
            Продать ({getCardPrice(card.rarity)})
          </Button>
        )}
      </div>
    </Card>
  );
};