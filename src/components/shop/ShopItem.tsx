import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getRarityLabel, getRarityDropRates } from "@/utils/cardUtils";
import { ShopItem as ShopItemType } from "./types";

interface ShopItemProps {
  item: ShopItemType;
  balance: number;
  onBuy: (item: ShopItemType) => void;
}

export const ShopItem = ({ item, balance, onBuy }: ShopItemProps) => {
  if (item.type === "cardPack") {
    return (
      <Card className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300">
        {item.image && (
          <div className="w-full aspect-[4/3] mb-4 rounded-lg overflow-hidden">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h3 className="text-lg font-semibold text-game-accent mb-2">{item.name}</h3>
        <p className="text-gray-400 mb-2">{item.description}</p>
        <p className="text-game-secondary mb-4">Цена: {item.price} токенов</p>
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger asChild>
            <Button
              className="w-full bg-game-primary hover:bg-game-primary/80"
              onClick={() => onBuy(item)}
              disabled={balance < item.price}
            >
              Купить
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 bg-game-background border-game-accent">
            <h4 className="text-game-accent font-semibold mb-2">Шансы выпадения:</h4>
            <div className="space-y-1">
              {Object.entries(getRarityDropRates()).map(([rarity, chance]) => (
                <div key={rarity} className="flex justify-between text-sm">
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
    <Card className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300">
      <h3 className="text-lg font-semibold text-game-accent mb-2">{item.name}</h3>
      <p className="text-gray-400 mb-2">{item.description}</p>
      <p className="text-game-secondary mb-4">Цена: {item.price} токенов</p>
      <Button
        className="w-full bg-game-primary hover:bg-game-primary/80"
        onClick={() => onBuy(item)}
        disabled={balance < item.price}
      >
        Купить
      </Button>
    </Card>
  );
};