import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/battle/Inventory";
import { useToast } from "@/hooks/use-toast";
import { getItemPrice } from "@/utils/itemUtils";
import { ItemCard } from "./inventory/ItemCard";
import { GroupedItem } from "./inventory/types";
import { useInventory } from "./inventory/useInventory";
import { useBalanceState } from "@/hooks/useBalanceState";
import { shopItems } from "../shop/types";
import { Coins } from "lucide-react";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { DragonEggTimer } from "./DragonEggTimer";

interface InventoryDisplayProps {
  inventory: Item[];
  onUseItem?: (item: Item) => void;
  readonly?: boolean;
}

export const InventoryDisplay = ({ 
  inventory: initialInventory, 
  onUseItem, 
  readonly = false 
}: InventoryDisplayProps) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const inventory = useInventory(initialInventory);
  const { balance, updateBalance } = useBalanceState();
  const { eggs } = useDragonEggs();

  const getItemImage = (itemName: string) => {
    const shopItem = shopItems.find(item => item.name === itemName);
    return shopItem?.image || '';
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
          items: [item],
          image: getItemImage(item.name)
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
        description: `${item.name} был использован.`,
      });
    }
  };

  const handleSellItem = (item: Item) => {
    const price = getItemPrice(item);
    const sellPrice = Math.floor(price * 0.7);
    const newBalance = balance + sellPrice;
    
    updateBalance(newBalance);
    
    const newInventory = inventory.filter(i => i.id !== item.id);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    
    const inventoryEvent = new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory }
    });
    window.dispatchEvent(inventoryEvent);
    
    toast({
      title: "Предмет продан",
      description: `${item.name} продан за ${sellPrice} монет`,
    });
  };

  const handleSelectItem = (item: Item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else if (selectedItems.length < 2) {
      setSelectedItems([...selectedItems, item]);
    }
  };

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
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">Инвентарь</h3>
          <div className="flex items-center gap-2 bg-game-surface/80 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-medium">{balance}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {eggs.length > 0 && (
            <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {eggs.map((egg) => (
                <DragonEggTimer
                  key={egg.id}
                  rarity={egg.rarity}
                  petName={egg.petName}
                  createdAt={egg.createdAt}
                  onHatch={() => {
                    const eggToRemove = eggs.find(e => e.id === egg.id);
                    if (eggToRemove) {
                      toast({
                        title: "Питомец получен!",
                        description: `${eggToRemove.petName} теперь доступен в вашей коллекции`,
                      });
                    }
                  }}
                />
              ))}
            </div>
          )}
          {inventory.length > 0 ? (
            groupItems(inventory).map((item) => (
              <Card 
                key={`${item.name}-${item.type}-${item.value}`}
                className="p-2 bg-game-surface/80 border-game-accent backdrop-blur-sm"
              >
                <div className="flex flex-col gap-1">
                  {item.image && (
                    <div className="w-full aspect-square mb-1 rounded-lg overflow-hidden">
                      <img 
                        src={item.image} 
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
                  {!readonly && window.location.pathname === '/battle' && (
                    <Button 
                      onClick={() => handleUseGroupedItem(item)} 
                      variant="outline" 
                      size="sm"
                      className="mt-1 text-xs bg-game-surface/50 hover:bg-game-surface/70"
                    >
                      Использовать
                    </Button>
                  )}
                  {!readonly && (
                    <Button
                      onClick={() => handleSellItem(item.items[0])}
                      variant="destructive"
                      size="sm"
                      className="mt-1 text-xs"
                    >
                      Продать
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <p className="text-gray-400 col-span-full text-center py-4">Инвентарь пуст</p>
          )}
        </div>
      </div>
    </div>
  );
};