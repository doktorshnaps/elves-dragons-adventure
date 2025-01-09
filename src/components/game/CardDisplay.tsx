import { Card as CardType } from "@/types/cards";
import { getRarityLabel, getCardPrice } from "@/utils/cardUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Coins, Heart } from "lucide-react";
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
    <Card className={`p-3 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 ${className}`}>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <h3 className={`font-semibold text-game-accent ${isMobile ? 'text-sm' : ''}`}>
            {card.name} ({card.type === 'character' ? 'Герой' : 'Питомец'})
          </h3>
          <span className={`text-yellow-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {getRarityLabel(card.rarity)}
          </span>
        </div>
        
        <div className={`flex gap-3 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>
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

        {showSellButton && (
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="mt-1 text-yellow-500 hover:text-yellow-600 text-xs"
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