import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupedItem } from "./types";
import { Coins } from "lucide-react";

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
  return (
    <Card
      className={`p-4 bg-game-background min-h-[200px] w-full cursor-pointer
        ${isSelected ? 'border-purple-500' : 'border-game-accent'}
        ${!readonly ? 'hover:border-game-primary' : ''}
        transition-all duration-300`}
      onClick={() => !readonly && onSelect()}
    >
      <div className="flex flex-col h-full">
        {item.image && (
          <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h3 className="font-semibold text-game-accent text-sm mb-2">
          {item.name} {item.count > 1 && `(${item.count})`}
        </h3>
        <p className="text-gray-400 text-xs mb-auto">
          {item.type === 'cardPack' && `Содержит ${item.value} случайных карт`}
        </p>
        <div className="flex gap-2 mt-4">
          {!readonly && showUseButton && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onUse();
              }}
            >
              Использовать
            </Button>
          )}
          {!readonly && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-yellow-500 hover:text-yellow-600 text-xs"
              onClick={(e) => {
                e.stopPropagation();
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