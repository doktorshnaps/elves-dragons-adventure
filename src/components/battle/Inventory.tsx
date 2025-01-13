import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="mt-4">
      <h3 className="text-xl font-bold text-game-accent mb-4">Инвентарь</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {groupedItems.map((item) => (
          <Card 
            key={`${item.name}-${item.type}-${item.value}`} 
            className="p-4 bg-game-surface border-game-accent"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-game-accent">
                  {item.name} {item.count > 1 && `(${item.count})`}
                </h4>
              </div>
              <Button 
                onClick={() => onUseItem(item.items[0])} 
                variant="outline" 
                className="mt-2"
              >
                Использовать
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};