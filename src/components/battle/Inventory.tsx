import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sword, Beaker } from "lucide-react";

export interface Item {
  id: number;
  name: string;
  type: "weapon" | "armor" | "healthPotion" | "defensePotion";
  value: number;
  image?: string;
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
  image?: string;
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
        items: [item],
        image: item.image
      });
    }

    return acc;
  }, []);

  const getItemIcon = (type: Item["type"]) => {
    switch (type) {
      case "weapon":
        return <Sword className="w-4 h-4" />;
      case "armor":
        return <Shield className="w-4 h-4" />;
      case "healthPotion":
      case "defensePotion":
        return <Beaker className="w-4 h-4" />;
    }
  };

  const getItemDescription = (item: GroupedItem) => {
    switch (item.type) {
      case "weapon":
        return `+${item.value} к силе атаки`;
      case "armor":
        return `+${item.value} к защите`;
      case "healthPotion":
        return `Восстанавливает ${item.value} здоровья`;
      case "defensePotion":
        return `Восстанавливает ${item.value} защиты`;
    }
  };

  const handleUseItem = (groupedItem: GroupedItem) => {
    // Используем первый предмет из группы
    const itemToUse = groupedItem.items[0];
    onUseItem(itemToUse);
  };

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold text-game-accent mb-4">Инвентарь</h3>
      <div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-lg"
        style={{
          backgroundImage: "url('/lovable-uploads/19465417-5ecf-4b7e-ba12-b580171ae51b.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backgroundBlendMode: 'overlay'
        }}
      >
        {groupedItems.map((item) => (
          <Card 
            key={`${item.name}-${item.type}-${item.value}`} 
            className="p-4 bg-game-surface/90 border-game-accent backdrop-blur-sm"
          >
            <div className="flex flex-col gap-2">
              {item.image && (
                <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                {getItemIcon(item.type)}
                <h4 className="font-bold text-game-accent">
                  {item.name} {item.count > 1 && `(${item.count})`}
                </h4>
              </div>
              <p className="text-sm text-gray-400">{getItemDescription(item)}</p>
              <Button 
                onClick={() => handleUseItem(item)} 
                variant="outline" 
                className="mt-2 bg-game-surface/50 hover:bg-game-surface/80"
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