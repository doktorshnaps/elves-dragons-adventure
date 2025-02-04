import { Card as CardType } from "@/types/cards";
import { getRarityLabel, getCardPrice } from "@/utils/cardUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Coins, Heart, Sparkles, ArrowUpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useRef } from "react";

interface CardDisplayProps {
  card: CardType;
  showSellButton?: boolean;
  onSell?: (card: CardType) => void;
  className?: string;
  isActive?: boolean;
  isSelected?: boolean;
  onUpgrade?: () => void;
}

export const CardDisplay = ({ 
  card, 
  showSellButton, 
  onSell, 
  className = "", 
  isActive = true,
  isSelected = false,
  onUpgrade
}: CardDisplayProps) => {
  const isMobile = useIsMobile();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && card.image) {
      const img = new Image();
      img.src = card.image;
      
      if (img.complete) {
        imgRef.current.src = card.image;
      } else {
        img.onload = () => {
          if (imgRef.current) {
            imgRef.current.src = card.image!;
          }
        };
      }
    }
  }, [card.image]);

  return (
    <Card className={`p-0.5 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full flex flex-col ${
      !isActive && card.type === 'pet' ? 'opacity-50' : ''
    } ${className}`}>
      <div className="flex flex-col gap-0.5 flex-grow">
        {card.image && (
          <div className={`w-full ${isMobile ? 'aspect-[3/4]' : 'aspect-square'} mb-0.5 rounded-lg overflow-hidden`}>
            <img 
              ref={imgRef}
              alt={card.name}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        )}
        
        <div className="flex justify-between items-start gap-0.5 px-0.5">
          <h3 className={`font-semibold text-game-accent break-words ${isMobile ? 'text-[8px]' : 'text-xs'} leading-tight`}>
            {card.name}
          </h3>
          <span className={`text-yellow-500 whitespace-nowrap ${isMobile ? 'text-[8px]' : 'text-xs'}`}>
            {getRarityLabel(card.rarity)}
          </span>
        </div>

        <div className={`text-purple-400 px-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'}`}>
          ({card.type === 'character' ? 'Герой' : 'Питомец'})
        </div>

        {card.faction && (
          <div className={`flex items-center gap-0.5 px-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} ${
            !isActive && card.type === 'pet' ? 'text-red-400' : 'text-purple-400'
          }`}>
            <Sparkles className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
            <span className="break-words">{card.faction}</span>
          </div>
        )}
        
        <div className={`grid grid-cols-2 gap-0.5 px-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} text-gray-400 mt-0.5`}>
          <div className="flex items-center gap-0.5">
            <Heart className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} text-red-500 flex-shrink-0`} />
            <span>{card.health}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Sword className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} flex-shrink-0`} />
            <span>{card.power}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Shield className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} flex-shrink-0`} />
            <span>{card.defense}</span>
          </div>
        </div>

        {card.magicResistance && (
          <div className={`text-blue-400 px-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} break-words mt-0.5`}>
            Защита от {card.magicResistance.type} магии: {card.magicResistance.value}%
          </div>
        )}

        {!isActive && card.type === 'pet' && (
          <div className="text-red-400 text-[8px] mt-0.5 break-words px-0.5">
            Требуется герой {card.faction} {getRarityLabel(card.rarity)} или выше
          </div>
        )}
      </div>

      {showSellButton && (
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className={`mt-0.5 w-full text-[8px] h-4 ${
            isSelected ? 'bg-game-accent hover:bg-game-accent/80' : 'text-yellow-500 hover:text-yellow-600'
          }`}
          onClick={isSelected ? onUpgrade : () => onSell?.(card)}
        >
          {isSelected ? (
            <>
              <ArrowUpCircle className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} mr-0.5`} />
              Улучшить
            </>
          ) : (
            <>
              <Coins className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} mr-0.5`} />
              Продать ({getCardPrice(card.rarity)})
            </>
          )}
        </Button>
      )}
    </Card>
  );
};