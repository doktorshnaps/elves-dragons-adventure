import { Sword, Shield, FlaskConical, ArmorIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/battle/Inventory";
import { Equipment } from "@/types/equipment";
import { useToast } from "@/hooks/use-toast";
import { useEquipment } from "@/hooks/useEquipment";

interface GroupedItem {
  name: string;
  type: Item["type"] | Equipment["type"];
  value: number;
  count: number;
  items: (Item | Equipment)[];
}

interface InventoryDisplayProps {
  inventory: (Item | Equipment)[];
  onUseItem?: (item: Item) => void;
  readonly?: boolean;
}

export const InventoryDisplay = ({ inventory, onUseItem, readonly = false }: InventoryDisplayProps) => {
  const { toast } = useToast();
  const { handleEquip } = useEquipment();

  const getItemIcon = (type: string) => {
    switch (type) {
      case "weapon":
        return <Sword className="w-4 h-4" />;
      case "armor":
        return <ArmorIcon className="w-4 h-4" />;
      case "shield":
        return <Shield className="w-4 h-4" />;
      case "healthPotion":
      case "defensePotion":
        return <FlaskConical className="w-4 h-4" />;
      default:
        return <FlaskConical className="w-4 h-4" />;
    }
  };

  const getItemDescription = (item: GroupedItem) => {
    switch (item.type) {
      case "weapon":
        return `+${item.value} к силе атаки`;
      case "armor":
      case "shield":
        return `+${item.value} к защите`;
      case "ring":
        return `+${item.value} к характеристикам`;
      case "necklace":
        return `+${item.value} к здоровью`;
      case "healthPotion":
        return `Восстанавливает ${item.value} здоровья`;
      case "defensePotion":
        return `Восстанавливает ${item.value} защиты`;
      default:
        return "";
    }
  };

  const groupItems = (items: (Item | Equipment)[]) => {
    return items.reduce<GroupedItem[]>((acc, item) => {
      const existingGroup = acc.find(
        group => 
          group.name === item.name && 
          group.type === item.type && 
          'value' in item && group.value === item.value
      );

      if (existingGroup) {
        existingGroup.count += 1;
        existingGroup.items.push(item);
      } else {
        acc.push({
          name: item.name,
          type: item.type,
          value: 'value' in item ? item.value : 0,
          count: 1,
          items: [item]
        });
      }

      return acc;
    }, []);
  };

  const handleItemUse = (groupedItem: GroupedItem) => {
    if (!readonly && groupedItem.items.length > 0) {
      const item = groupedItem.items[0];
      
      if ('equipped' in item) {
        // Это предмет экипировки
        handleEquip(item as Equipment);
        toast({
          title: "Предмет экипирован",
          description: `${item.name} был экипирован`,
        });
      } else if (onUseItem) {
        // Это расходуемый предмет
        onUseItem(item as Item);
        toast({
          title: "Предмет использован",
          description: `${item.name} был использован. ${getItemDescription(groupedItem)}`,
        });
      }
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
              className={`p-4 bg-game-background border-game-accent ${!readonly ? 'hover:border-game-primary cursor-pointer' : ''} transition-all duration-300`}
              onClick={() => handleItemUse(item)}
            >
              <div className="flex items-center gap-2 mb-2">
                {getItemIcon(item.type)}
                <h3 className="font-semibold text-game-accent">
                  {item.name} {item.count > 1 && `(${item.count})`}
                </h3>
              </div>
              <p className="text-sm text-gray-400">{getItemDescription(item)}</p>
              {!readonly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemUse(item);
                  }}
                  className="mt-2 w-full"
                >
                  {'equipped' in item.items[0] ? 'Экипировать' : 'Использовать'}
                </Button>
              )}
            </Card>
          ))
        ) : (
          <p className="text-gray-400 col-span-3 text-center py-8">Инвентарь пуст</p>
        )}
      </div>
    </Card>
  );
};