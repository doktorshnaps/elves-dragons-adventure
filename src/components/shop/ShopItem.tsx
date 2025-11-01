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
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface ShopItemProps {
  item: ShopItemType;
  balance: number;
  onBuy: (item: ShopItemType) => void;
}

export const ShopItem = ({ item, balance, onBuy }: ShopItemProps) => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [showDropRates, setShowDropRates] = useState(false);
  const canAfford = balance >= item.price;
  
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
      <Card className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-[320px] flex flex-col justify-between">
        {item.image && (
          <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <h3 className={`font-semibold text-game-accent mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {item.name}
          </h3>
          <p className={`text-gray-400 mb-1 flex-grow ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            {item.description}
          </p>
          <p className={`text-game-secondary mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            {t(language, 'shopItem.price')} {item.price} ELL
          </p>
          <div 
            onMouseEnter={() => setShowDropRates(true)}
            onMouseLeave={() => setShowDropRates(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <HoverCard open={showDropRates}>
              <HoverCardTrigger asChild>
                <Button
                  className={`w-full bg-game-primary hover:bg-game-primary/80 ${isMobile ? 'text-[10px] py-1' : 'text-xs py-2'}`}
                  onClick={() => onBuy(item)}
                  disabled={!canAfford}
                >
                  {t(language, 'shopItem.buy')}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-48 bg-game-background border-game-accent p-2">
                <h4 className={`text-game-accent font-semibold mb-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  {t(language, 'shopItem.dropRates')}
                </h4>
                <div className="space-y-1">
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1">{t(language, 'shopItem.heroes')}</p>
                    {Object.values(getRarityDropRates().heroes).map((item) => (
                      <div key={item.name} className="flex justify-between text-[10px]">
                        <span className="text-gray-400">{item.name}</span>
                        <span className="text-game-accent">{item.chance}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">{t(language, 'shopItem.dragons')}</p>
                    {Object.values(getRarityDropRates().dragons).map((item) => (
                      <div key={item.name} className="flex justify-between text-[10px]">
                        <span className="text-gray-400">{item.name}</span>
                        <span className="text-game-accent">{item.chance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-[320px] flex flex-col justify-between">
      {item.image && (
        <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <h3 className={`font-semibold text-game-accent mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {item.name}
        </h3>
        <p className={`text-gray-400 mb-1 flex-grow ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          {item.description}
        </p>
        {item.stats && (
          <div className={`text-game-accent mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            {item.stats.power && <p>{t(language, 'shopItem.power')} +{item.stats.power}</p>}
            {item.stats.defense && <p>{t(language, 'shopItem.defense')} +{item.stats.defense}</p>}
            {item.stats.health && <p>{t(language, 'shopItem.health')} +{item.stats.health}</p>}
          </div>
        )}
        {item.requiredLevel && (
          <p className={`text-yellow-500 mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            {t(language, 'shopItem.requiredLevel')} {item.requiredLevel}
          </p>
        )}
        <p className={`text-game-secondary mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          {t(language, 'shopItem.price')} {item.price} ELL
        </p>
        <Button
          type="button"
          className={`w-full bg-game-primary hover:bg-game-primary/80 ${isMobile ? 'text-[10px] py-1' : 'text-xs py-2'}`}
          onClick={() => onBuy(item)}
          disabled={!canAfford}
        >
          {t(language, 'shopItem.buy')}
        </Button>
      </div>
    </Card>
  );
};