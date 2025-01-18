import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/battle/Inventory";
import { GroupedItem } from "./types";

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
  if (groupedItems.length === 0) {
    return <p className="text-gray-400 col-span-full text-center py-4">Инвентарь пуст</p>;
  }

  return (
    <>
      {groupedItems.map((item) => (
        <Card 
          key={`${item.name}-${item.type}-${item.value}`}
          className="p-2 bg-game-surface/80 border-game-accent backdrop-blur-sm h-[180px] flex flex-col"
        >
          <div className="flex flex-col gap-1 flex-grow">
            {item.image && (
              <div className="relative w-full h-20 mb-1 rounded-lg overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-game-accent text-xs">
                {item.name} {item.count > 1 && `(${item.count})`}
              </h4>
            </div>
            {!readonly && window.location.pathname === '/battle' && (
              <Button 
                onClick={() => onUseItem(item)} 
                variant="outline" 
                size="sm"
                className="mt-1 text-xs bg-game-surface/50 hover:bg-game-surface/70"
              >
                Использовать
              </Button>
            )}
            {!readonly && item.type !== 'dragon_egg' && (
              <Button
                onClick={() => onSellItem(item.items[0])}
                variant="destructive"
                size="sm"
                className="mt-1 text-xs"
              >
                Продать
              </Button>
            )}
          </div>
        </Card>
      ))}
    </>
  );
};