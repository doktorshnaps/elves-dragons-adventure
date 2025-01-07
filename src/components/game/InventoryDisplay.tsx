import { useState } from "react";
import { Sword, Shield, FlaskConical, ShieldHalf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/battle/Inventory";
import { Equipment } from "@/types/equipment";
import { useToast } from "@/hooks/use-toast";
import { useEquipment } from "@/hooks/useEquipment";
import { SellItemDialog } from "./SellItemDialog";
import { UpgradeItemDialog } from "./UpgradeItemDialog";

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
  onBalanceChange?: (newBalance: number) => void;
}

export const InventoryDisplay = ({ 
  inventory, 
  onUseItem, 
  readonly = false,
  onBalanceChange 
}: InventoryDisplayProps) => {
  const { toast } = useToast();
  const { handleEquip } = useEquipment();
  const [showSellDialog, setShowSellDialog] = useState<Item | Equipment | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const getItemIcon = (type: string) => {
    switch (type) {
      case "weapon":
        return <Sword className="w-4 h-4" />;
      case "armor":
        return <ShieldHalf className="w-4 h-4" />;
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

  const handleSellItem = (item: Item | Equipment, price: number) => {
    const newInventory = inventory.filter(i => i !== item);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    
    const currentBalance = parseInt(localStorage.getItem('gameBalance') || '0', 10);
    const newBalance = currentBalance + price;
    localStorage.setItem('gameBalance', newBalance.toString());
    
    if (onBalanceChange) {
      onBalanceChange(newBalance);
    }

    window.dispatchEvent(new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory } 
    }));
  };

  const handleUpgradeItems = ([item1, item2]: [Item | Equipment, Item | Equipment]) => {
    const newInventory = inventory.filter(i => i !== item1 && i !== item2);
    
    const upgradedItem = {
      ...item1,
      id: Date.now(),
      name: `Улучшенный ${item1.name}`,
      value: Math.floor(item1.value * 1.5),
      power: 'power' in item1 ? Math.floor((item1.power || 0) * 1.5) : undefined,
      defense: 'defense' in item1 ? Math.floor((item1.defense || 0) * 1.5) : undefined,
    };
    
    newInventory.push(upgradedItem);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    
    window.dispatchEvent(new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory } 
    }));
  };

  return (
    <Card className="bg-game-surface border-game-accent p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-game-accent">Инвентарь</h2>
        {!readonly && (
          <Button 
            variant="outline" 
            onClick={() => setShowUpgradeDialog(true)}
            className="text-game-accent border-game-accent"
          >
            Улучшить предметы
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inventory.length > 0 ? (
          inventory.map((item) => (
            <Card
              key={item.id}
              className={`p-4 bg-game-background border-game-accent ${!readonly ? 'hover:border-game-primary cursor-pointer' : ''} transition-all duration-300`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getItemIcon(item.type)}
                <h3 className="font-semibold text-game-accent">{item.name}</h3>
              </div>
              <p className="text-sm text-gray-400">
                {getItemDescription({ 
                  name: item.name, 
                  type: item.type, 
                  value: 'value' in item ? item.value : 0,
                  count: 1,
                  items: [item]
                })}
              </p>
              {!readonly && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if ('equipped' in item) {
                        handleEquip(item as Equipment);
                      } else if (onUseItem) {
                        onUseItem(item as Item);
                      }
                    }}
                    className="flex-1"
                  >
                    {'equipped' in item ? 'Экипировать' : 'Использовать'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSellDialog(item)}
                    className="flex-1"
                  >
                    Продать
                  </Button>
                </div>
              )}
            </Card>
          ))
        ) : (
          <p className="text-gray-400 col-span-3 text-center py-8">Инвентарь пуст</p>
        )}
      </div>

      {showSellDialog && (
        <SellItemDialog
          item={showSellDialog}
          onSell={handleSellItem}
          onClose={() => setShowSellDialog(null)}
        />
      )}

      {showUpgradeDialog && (
        <UpgradeItemDialog
          items={inventory}
          onUpgrade={handleUpgradeItems}
          onClose={() => setShowUpgradeDialog(false)}
        />
      )}
    </Card>
  );
};
