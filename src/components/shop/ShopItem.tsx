import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getRarityLabel, getRarityDropRates } from "@/utils/cardUtils";
import { ShopItem as ShopItemType } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useCallback } from "react";

interface ShopItemProps {
  item: ShopItemType;
  balance: number;
  onBuy: (item: ShopItemType) => void;
}

export const ShopItem = ({ item, balance, onBuy }: ShopItemProps) => {
  const isMobile = useIsMobile();
  const [showDropRates, setShowDropRates] = useState(false);
  
  const handleTouchStart = useCallback(() => {
    if (item.type === "cardPack") {
      const timer = setTimeout(() => {
        setShowDropRates(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [item.type]);

  const handleTouchEnd = useCallback(() => {
    setShowDropRates(false);
  }, []);

  if (item.type === "cardPack") {
    return (
      <Card className="p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300">
        {item.image && (
          <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h3 className={`font-semibold text-game-accent mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>{item.name}</h3>
        <p className={`text-gray-400 mb-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>{item.description}</p>
        <p className={`text-game-secondary mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Цена: {item.price} токенов</p>
        <HoverCard open={showDropRates}>
          <HoverCardTrigger asChild>
            <Button
              className={`w-full bg-game-primary hover:bg-game-primary/80 ${isMobile ? 'text-[10px] py-1' : 'text-xs py-2'}`}
              onClick={() => onBuy(item)}
              disabled={balance < item.price}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              Купить
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-48 bg-game-background border-game-accent p-2">
            <h4 className={`text-game-accent font-semibold mb-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Шансы выпадения:</h4>
            <div className="space-y-1">
              {Object.entries(getRarityDropRates()).map(([rarity, chance]) => (
                <div key={rarity} className="flex justify-between text-[10px]">
                  <span className="text-gray-400">
                    {getRarityLabel(Number(rarity) as 1|2|3|4|5|6|7|8)}
                  </span>
                  <span className="text-game-accent">{chance}</span>
                </div>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      </Card>
    );
  }

  return (
    <Card className="p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300">
      {item.image && (
        <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <h3 className={`font-semibold text-game-accent mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>{item.name}</h3>
      <p className={`text-gray-400 mb-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>{item.description}</p>
      <p className={`text-game-secondary mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Цена: {item.price} токенов</p>
      <Button
        className={`w-full text-xs bg-game-primary hover:bg-game-primary/80 ${isMobile ? 'text-[10px] py-1' : 'text-xs py-2'}`}
        onClick={() => onBuy(item)}
        disabled={balance < item.price}
      >
        Купить
      </Button>
    </Card>
  );
};