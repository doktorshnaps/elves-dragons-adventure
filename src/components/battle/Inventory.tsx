import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { shopItems } from "../shop/types";

export interface Item {
  id: number;
  name: string;
  type: "cardPack" | "healthPotion";
  value: number;
}

interface InventoryProps {
  items: Item[];
  onUseItem: (item: Item) => void;
}

interface GroupedItem {
  name: string;
  type: Item["type"];
  value: number;
  count: number;
  items: Item[];
}

export const Inventory = ({ items, onUseItem }: InventoryProps) => {
  const getItemImage = (itemName: string) => {
    const shopItem = shopItems.find(item => item.name === itemName);
    return shopItem?.image || '';
  };

  const groupedItems = items.reduce<GroupedItem[]>((acc, item) => {
    const existingGroup = acc.find(
      group => 
        group.name === item.name && 
        group.type === item.type && 
        group.value === item.value
    );

    if (existingGroup) {
      existingGroup.count += 1;
      existingGroup.items.push(item);
    } else {
      acc.push({
        name: item.name,
        type: item.type,
        value: item.value,
        count: 1,
        items: [item]
      });
    }

    return acc;
  }, []);

  return (
    <div 
      className="mt-4 relative rounded-lg overflow-hidden"
      style={{
        backgroundImage: 'url("/lovable-uploads/2eecde4e-bda9-4f8f-8105-3e6dcdff36fc.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-4 drop-shadow-lg">Инвентарь</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {groupedItems.map((item) => (
            <Card 
              key={`${item.name}-${item.type}-${item.value}`} 
              className="p-2 bg-game-surface/80 border-game-accent backdrop-blur-sm"
            >
              <div className="flex flex-col gap-1">
                {getItemImage(item.name) && (
                  <div className="w-full aspect-square mb-1 rounded-lg overflow-hidden">
                    <img 
                      src={getItemImage(item.name)} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-game-accent text-xs">
                    {item.name} {item.count > 1 && `(${item.count})`}
                  </h4>
                </div>
                <Button 
                  onClick={() => onUseItem(item.items[0])} 
                  variant="outline" 
                  size="sm"
                  className="mt-1 text-xs bg-game-surface/50 hover:bg-game-surface/70"
                >
                  Использовать
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};