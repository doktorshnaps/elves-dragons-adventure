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
      // Предварительно загружаем изображение
      const img = new Image();
      img.src = card.image;
      
      // Если изображение уже в кэше браузера, сразу отображаем его
      if (img.complete) {
        imgRef.current.src = card.image;
      } else {
        // Если изображение не в кэше, ждем загрузки
        img.onload = () => {
          if (imgRef.current) {
            imgRef.current.src = card.image!;
          }
        };
      }
    }
  }, [card.image]);

  return (
    <Card className={`p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full flex flex-col ${
      !isActive && card.type === 'pet' ? 'opacity-50' : ''
    } ${className}`}>
      <div className="flex flex-col gap-1 flex-grow">
        {card.image && (
          <div className="w-full aspect-square mb-1 rounded-lg overflow-hidden">
            <img 
              ref={imgRef}
              alt={card.name}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              style={{ contentVisibility: 'auto' }}
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
          <div className={`flex items-center gap-1 ${isMobile ? 'text-[10px]' : 'text-xs'} ${
            !isActive && card.type === 'pet' ? 'text-red-400' : 'text-purple-400'
          }`}>
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

        {!isActive && card.type === 'pet' && (
          <div className="text-red-400 text-xs mt-1">
            Требуется герой {card.faction} {getRarityLabel(card.rarity)} или выше
          </div>
        )}
      </div>

      {showSellButton && (
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className={`mt-auto w-full text-[10px] ${
            isSelected ? 'bg-game-accent hover:bg-game-accent/80' : 'text-yellow-500 hover:text-yellow-600'
          }`}
          onClick={isSelected ? onUpgrade : () => onSell?.(card)}
        >
          {isSelected ? (
            <>
              <ArrowUpCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
              Улучшить
            </>
          ) : (
            <>
              <Coins className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
              Продать ({getCardPrice(card.rarity)})
            </>
          )}
        </Button>
      )}
    </Card>
  );
};