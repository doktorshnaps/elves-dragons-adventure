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
  // Определяем изображение по умолчанию для зелий здоровья
  const getDefaultImage = () => {
    if (item.type === 'healthPotion') {
      if (item.value === 30) {
        return "/lovable-uploads/6693dd2b-2511-4c63-ae03-a1b208a8e7da.png";
      } else if (item.value === 70) {
        return "/lovable-uploads/5b0afe54-887d-46f3-a3d1-2696cb956374.png";
      }
    }
    return null;
  };

  const itemImage = item.image || getDefaultImage();

  return (
    <Card
      className={`p-4 bg-game-background cursor-pointer relative
        ${isSelected ? 'border-purple-500' : 'border-game-accent'}
        ${!readonly ? 'hover:border-game-primary' : ''}
        transition-all duration-300`}
      onClick={() => !readonly && onSelect()}
    >
      <div className="flex flex-col gap-2">
        {itemImage && (
          <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden bg-game-surface">
            <img 
              src={itemImage} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h3 className="font-semibold text-game-accent">
          {item.name} {item.count > 1 && `(${item.count})`}
        </h3>
        <p className="text-gray-400 text-sm">
          {item.type === 'healthPotion' && `Восстанавливает ${item.value} HP`}
          {item.type === 'defensePotion' && `Увеличивает защиту на ${item.value}`}
          {item.type === 'weapon' && `Увеличивает атаку на ${item.value}`}
          {item.type === 'armor' && `Увеличивает защиту на ${item.value}`}
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