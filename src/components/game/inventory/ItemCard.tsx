import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { GroupedItem } from "./types";
import { ItemIcon } from "./ItemIcon";
import { ItemDescription } from "./ItemDescription";
import { getItemPrice } from "@/utils/itemUtils";

interface ItemCardProps {
  item: GroupedItem;
  readonly: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
  onSell: () => void;
}

export const ItemCard = ({ 
  item, 
  readonly, 
  isSelected, 
  onSelect, 
  onUse, 
  onSell 
}: ItemCardProps) => {
  return (
    <Card
      className={`p-4 bg-game-background border-game-accent 
        ${!readonly ? 'hover:border-game-primary cursor-pointer' : ''} 
        ${isSelected ? 'border-purple-500' : ''}
        transition-all duration-300`}
      onClick={() => !readonly && onSelect()}
    >
      <div className="flex items-center gap-2 mb-2">
        <ItemIcon type={item.type} />
        <h3 className="font-semibold text-game-accent">
          {item.name} {item.count > 1 && `(${item.count})`}
        </h3>
      </div>
      <ItemDescription item={item} />
      <div className="flex gap-2 mt-2">
        {!readonly && (
          <>
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
              Продать ({getItemPrice(item.items[0])})
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};