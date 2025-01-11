import { useState, useEffect } from "react";
import { Sword, Shield, FlaskConical, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/battle/Inventory";
import { useToast } from "@/hooks/use-toast";
import { getItemPrice, canUpgradeItems, upgradeItems } from "@/utils/itemUtils";

interface GroupedItem {
  name: string;
  type: Item["type"];
  value: number;
  count: number;
  items: Item[];
}

interface InventoryDisplayProps {
  inventory: Item[];
  onUseItem?: (item: Item) => void;
  readonly?: boolean;
}

export const InventoryDisplay = ({ inventory: initialInventory, onUseItem, readonly = false }: InventoryDisplayProps) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState(initialInventory);

  useEffect(() => {
    const handleInventoryUpdate = (e: CustomEvent<{ inventory: Item[] }>) => {
      setInventory(e.detail.inventory);
    };

    const handleStorageChange = () => {
      const savedInventory = localStorage.getItem('gameInventory');
      if (savedInventory) {
        setInventory(JSON.parse(savedInventory));
      }
    };

    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Проверяем состояние каждые 500мс
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const getItemIcon = (type: Item["type"]) => {
    switch (type) {
      case "weapon":
        return <Sword className="w-4 h-4" />;
      case "armor":
        return <Shield className="w-4 h-4" />;
      case "healthPotion":
      case "defensePotion":
        return <FlaskConical className="w-4 h-4" />;
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
    if (!readonly && onUseItem && groupedItem.items.length > 0) {
      const item = groupedItem.items[0];
      onUseItem(item);
      
      toast({
        title: "Предмет использован",
        description: `${item.name} был использован. ${getItemDescription({ ...groupedItem, items: [item] })}`,
      });
    }
  };

  const handleSellItem = (item: Item) => {
    const price = getItemPrice(item);
    const currentBalance = parseInt(localStorage.getItem('gameBalance') || '0');
    const newBalance = currentBalance + Math.floor(price * 0.7); // 70% of original price
    
    // Dispatch balance update event
    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);
    
    // Remove item from inventory
    const newInventory = inventory.filter(i => i.id !== item.id);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    
    // Dispatch inventory update event
    const inventoryEvent = new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory }
    });
    window.dispatchEvent(inventoryEvent);
    
    toast({
      title: "Предмет продан",
      description: `${item.name} продан за ${Math.floor(price * 0.7)} монет`,
    });
  };

  const handleSelectItem = (item: Item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else if (selectedItems.length < 2) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleUpgradeItems = () => {
    if (selectedItems.length !== 2) return;
    
    const newInventory = upgradeItems(inventory, selectedItems);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    
    const event = new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory }
    });
    window.dispatchEvent(event);
    
    setSelectedItems([]);
    
    toast({
      title: "Предметы улучшены",
      description: "Два предмета были успешно объединены в улучшенную версию!",
    });
  };

  const canUpgrade = selectedItems.length === 2 && 
    selectedItems[0].name === selectedItems[1].name && 
    selectedItems[0].type === selectedItems[1].type && 
    selectedItems[0].value === selectedItems[1].value;

  return (
    <Card className="bg-game-surface border-game-accent p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-game-accent">Инвентарь</h2>
        {canUpgrade && (
          <Button 
            onClick={handleUpgradeItems}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Улучшить выбранные предметы
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inventory.length > 0 ? (
          groupItems(inventory).map((item) => (
            <Card
              key={`${item.name}-${item.type}-${item.value}`}
              className={`p-4 bg-game-background border-game-accent 
                ${!readonly ? 'hover:border-game-primary cursor-pointer' : ''} 
                ${selectedItems.some(i => i.id === item.items[0].id) ? 'border-purple-500' : ''}
                transition-all duration-300`}
              onClick={() => !readonly && handleSelectItem(item.items[0])}
            >
              <div className="flex items-center gap-2 mb-2">
                {getItemIcon(item.type)}
                <h3 className="font-semibold text-game-accent">
                  {item.name} {item.count > 1 && `(${item.count})`}
                </h3>
              </div>
              <p className="text-sm text-gray-400 mb-2">{getItemDescription(item)}</p>
              <div className="flex gap-2 mt-2">
                {!readonly && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseGroupedItem(item);
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
                        handleSellItem(item.items[0]);
                      }}
                    >
                      <Coins className="w-4 h-4 mr-1" />
                      Продать ({getItemPrice(item.items[0])})
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        ) : (
          <p className="text-gray-400 col-span-3 text-center py-8">Инвентарь пуст</p>
        )}
      </div>
    </Card>
  );
};
