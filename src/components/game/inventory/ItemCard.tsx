import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupedItem } from "./types";
import { Coins } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItemCardProps {
  item: GroupedItem;
  readonly: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
  onSell: () => void;
  showUseButton?: boolean;
}

export const ItemCard = ({
  item,
  readonly,
  isSelected,
  onSelect,
  onUse,
  onSell,
  showUseButton = true
}: ItemCardProps) => {
  const isMobile = useIsMobile();
  
  // Все предметы можно продавать (проверка через item_instances)
  const canSell = !readonly;

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
          {item.name} {item.count > 1 && `(${item.count})`}
        </h3>
        <p className={`text-gray-400 mb-1 flex-grow ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          {item.type === 'cardPack' && `Содержит ${item.value} случайных карт`}
          {item.type === 'healthPotion' && `Восстанавливает ${item.value} здоровья`}
          {item.type === 'weapon' && 'Оружие для боя'}
          {item.type === 'armor' && 'Броня для защиты'}
          {item.type === 'dragon_egg' && 'Яйцо дракона'}
        </p>
        
        {/* Show stats if available */}
        {item.items[0]?.stats && (
          <div className={`text-game-accent mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            {item.items[0].stats.power && <p>Сила: +{item.items[0].stats.power}</p>}
            {item.items[0].stats.defense && <p>Защита: +{item.items[0].stats.defense}</p>}
            {item.items[0].stats.health && <p>Здоровье: +{item.items[0].stats.health}</p>}
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          {!readonly && showUseButton && (
            <Button
              className={`w-full bg-game-primary hover:bg-game-primary/80 ${isMobile ? 'text-[10px] py-1' : 'text-xs py-2'}`}
              onClick={(e) => {
                e.stopPropagation();
                onUse();
              }}
            >
              {item.type === 'cardPack' ? 'Открыть' : 'Использовать'}
            </Button>
          )}
          {!readonly && (
            <Button
              variant="outline"
              disabled={!canSell}
              className={`w-full text-yellow-500 hover:text-yellow-600 disabled:opacity-50 ${isMobile ? 'text-[10px] py-1' : 'text-xs py-2'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!canSell) return;
                onSell();
              }}
            >
              <Coins className="w-3 h-3 mr-1" />
              Продать
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};