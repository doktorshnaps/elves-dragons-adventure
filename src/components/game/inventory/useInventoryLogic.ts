import { useState } from "react";
import { Item } from "@/components/battle/Inventory";
import { useToast } from "@/hooks/use-toast";
import { getItemPrice } from "@/utils/itemUtils";
import { GroupedItem } from "./types";
import { shopItems } from "../../shop/types";
import { useBalanceState } from "@/hooks/useBalanceState";

export const useInventoryLogic = (initialInventory: Item[]) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const { balance, updateBalance } = useBalanceState();

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

  const handleSellItem = (item: Item) => {
    const price = getItemPrice(item);
    const sellPrice = Math.floor(price * 0.7);
    const newBalance = balance + sellPrice;
    
    updateBalance(newBalance);
    
    const newInventory = initialInventory.filter(i => i.id !== item.id);
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

  return {
    selectedItems,
    setSelectedItems,
    balance,
    groupItems,
    handleSellItem,
  };
};