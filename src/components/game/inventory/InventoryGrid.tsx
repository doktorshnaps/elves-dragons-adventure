import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/types/inventory";
import { GroupedItem } from "./types";
import { getRarityLabel } from "@/utils/cardUtils";

interface InventoryGridProps {
  groupedItems: GroupedItem[];
  readonly: boolean;
  onUseItem: (item: GroupedItem) => void;
  onSellItem: (item: Item) => void;
}

export const InventoryGrid = ({ 
  groupedItems, 
  readonly, 
  onUseItem, 
  onSellItem 
}: InventoryGridProps) => {
  const unequippedItems = groupedItems.filter(item => 
    !item.items.some(i => i.equipped)
  );

  if (unequippedItems.length === 0) {
    return <p className="text-gray-400 col-span-full text-center py-4 text-sm">Инвентарь пуст</p>;
  }

  return (
    <>
      {unequippedItems.map((item) => (
        <Card 
          key={`${item.name}-${item.type}-${item.value}`}
          className="w-[80px] h-[160px] p-2 bg-game-surface/80 border-game-accent backdrop-blur-sm flex flex-col mx-1 my-1"
        >
          <div className="flex flex-col h-full">
            {item.type === 'dragon_egg' ? (
              <div className="relative w-full h-[60px] mb-1 rounded-lg overflow-hidden bg-gray-800">
                {item.items[0].image ? (
                  <img 
                    src={item.items[0].image}
                    alt={item.name}
                    className="w-full h-full object-contain opacity-50"
                  />
                ) : (
                  <img 
                    src="/lovable-uploads/8a069dd4-47ad-496c-a248-f796257f9233.png"
                    alt="Dragon Egg"
                    className="w-full h-full object-contain opacity-50"
                  />
                )}
              </div>
            ) : item.image && (
              <div className="relative w-full h-[60px] mb-1 rounded-lg overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex flex-col flex-grow">
              <h4 className="font-bold text-game-accent text-[7px] truncate">
                {item.name} {item.count > 1 && `(${item.count})`}
              </h4>
              {item.type === 'dragon_egg' && (
                <div className="text-[6px] text-gray-300 truncate">
                  <p>Редкость: {getRarityLabel(item.value as 1|2|3|4|5|6|7|8)}</p>
                  {item.items[0].petName && (
                    <p className="truncate">Питомец: {item.items[0].petName}</p>
                  )}
                </div>
              )}
            </div>
            {!readonly && (
              <div className="mt-auto">
                {item.type !== 'dragon_egg' && (
                  <Button
                    onClick={() => onSellItem(item.items[0])}
                    variant="destructive"
                    size="sm"
                    className="w-full text-[6px] h-4"
                  >
                    Продать
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </>
  );
};