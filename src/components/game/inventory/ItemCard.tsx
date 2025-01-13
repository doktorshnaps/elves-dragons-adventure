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
      className={`p-4 bg-game-background cursor-pointer
        ${isSelected ? 'border-purple-500' : 'border-game-accent'}
        ${!readonly ? 'hover:border-game-primary' : ''}
        transition-all duration-300`}
      onClick={() => !readonly && onSelect()}
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-game-accent">
          {item.name} {item.count > 1 && `(${item.count})`}
        </h3>
        <p className="text-gray-400 text-sm">
          {item.type === 'cardPack' && `Содержит ${item.value} случайных карт`}
        </p>
        <div className="flex gap-2 mt-2">
          {!readonly && showUseButton && (
            <Button
              variant="outline"
              size="sm"
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
              className="text-yellow-500 hover:text-yellow-600"
              onClick={(e) => {
                e.stopPropagation();
                onSell();
              }}
            >
              <Coins className="w-4 h-4 mr-1" />
              Продать
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};