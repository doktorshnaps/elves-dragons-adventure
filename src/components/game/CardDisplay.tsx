import { Card as CardType } from "@/types/cards";
import { getRarityLabel, getCardPrice } from "@/utils/cardUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Coins } from "lucide-react";
import { motion } from "framer-motion";

interface CardDisplayProps {
  card: CardType;
  showSellButton?: boolean;
  onSell?: (card: CardType) => void;
  className?: string;
}

export const CardDisplay = ({ card, showSellButton, onSell, className = "" }: CardDisplayProps) => {
  return (
    <Card className={`p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 ${className}`}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-game-accent">
            {card.name} ({card.type === 'character' ? 'Герой' : 'Питомец'})
          </h3>
          <span className="text-yellow-500">{getRarityLabel(card.rarity)}</span>
        </div>
        
        <div className="flex gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Sword className="w-4 h-4" />
            <span>{card.power}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>{card.defense}</span>
          </div>
        </div>

        {showSellButton && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-yellow-500 hover:text-yellow-600"
            onClick={() => onSell?.(card)}
          >
            <Coins className="w-4 h-4 mr-1" />
            Продать ({getCardPrice(card.rarity)})
          </Button>
        )}
      </div>
    </Card>
  );
};