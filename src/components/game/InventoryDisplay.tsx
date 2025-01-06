import { Sword, Shield, Beaker } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Item } from "@/components/battle/Inventory";

interface GroupedItem {
  name: string;
  type: Item["type"];
  value: number;
  count: number;
  items: Item[];
}

interface InventoryDisplayProps {
  inventory: Item[];
  onUseItem: (item: Item) => void;
}

export const InventoryDisplay = ({ inventory, onUseItem }: InventoryDisplayProps) => {
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

  const groupItems = (items: Item[]): GroupedItem[] => {
    return items.reduce<GroupedItem[]>((acc, item) => {
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
  };

  const handleUseGroupedItem = (groupedItem: GroupedItem) => {
    if (groupedItem.items.length > 0) {
      onUseItem(groupedItem.items[0]);
    }
  };

  return (
    <Card className="bg-game-surface border-game-accent p-6">
      <h2 className="text-2xl font-bold text-game-accent mb-4">Инвентарь</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inventory.length > 0 ? (
          groupItems(inventory).map((item) => (
            <Card
              key={`${item.name}-${item.type}-${item.value}`}
              className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300"
              onClick={() => handleUseGroupedItem(item)}
            >
              <div className="flex items-center gap-2 mb-2">
                {getItemIcon(item.type)}
                <h3 className="font-semibold text-game-accent">
                  {item.name} {item.count > 1 && `(${item.count})`}
                </h3>
              </div>
              <p className="text-sm text-gray-400">{getItemDescription(item)}</p>
            </Card>
          ))
        ) : (
          <p className="text-gray-400 col-span-3 text-center py-8">Инвентарь пуст</p>
        )}
      </div>
    </Card>
  );
};