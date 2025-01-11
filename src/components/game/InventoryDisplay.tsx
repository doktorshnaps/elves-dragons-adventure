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
            onClick={() => {
              // Upgrade functionality will be implemented later
              setSelectedItems([]);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Улучшить выбранные предметы
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inventory.length > 0 ? (
          groupItems(inventory).map((item) => (
            <ItemCard
              key={`${item.name}-${item.type}-${item.value}`}
              item={item}
              readonly={readonly}
              isSelected={selectedItems.some(i => i.id === item.items[0].id)}
              onSelect={() => handleSelectItem(item.items[0])}
              onUse={() => handleUseGroupedItem(item)}
              onSell={() => handleSellItem(item.items[0])}
            />
          ))
        ) : (
          <p className="text-gray-400 col-span-3 text-center py-8">Инвентарь пуст</p>
        )}
      </div>
    </Card>
  );
};