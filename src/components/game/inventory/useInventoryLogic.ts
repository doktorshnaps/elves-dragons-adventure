import { useState } from "react";
import { Item } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { getItemPrice } from "@/utils/itemUtils";
import { useCardPackOpening } from "@/hooks/useCardPackOpening";
import { GroupedItem } from "./types";
import { shopItems } from "../../shop/types";
import { useGameData } from "@/hooks/useGameData";

export const useInventoryLogic = (initialInventory: Item[]) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const { gameData, updateGameData } = useGameData();
  const { 
    openCardPack, 
    isOpening, 
    revealedCard, 
    showRevealModal, 
    closeRevealModal 
  } = useCardPackOpening();
  const balance = gameData.balance;

  const getItemImage = (item: Item) => {
    if (item.image) return item.image;
    const shopItem = shopItems.find(shopItem => shopItem.name === item.name);
    return shopItem?.image || '';
  };

  const groupItems = (items: Item[]): GroupedItem[] => {
    return items.reduce<GroupedItem[]>((acc, item) => {
      // Группируем только предметы с одинаковым состоянием экипировки
      const existingGroup = acc.find(
        group => 
          group.name === item.name && 
          group.type === item.type && 
          group.value === item.value &&
          group.items[0]?.equipped === item.equipped // Проверяем состояние экипировки
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
          image: getItemImage(item)
        });
      }

      return acc;
    }, []);
  };

  const handleSellItem = async (item: Item) => {
    const price = getItemPrice(item);
    const sellPrice = Math.floor(price * 0.7);
    const newBalance = balance + sellPrice;
    
    const newInventory = (gameData.inventory || []).filter(i => i.id !== item.id);
    
    await updateGameData({
      balance: newBalance,
      inventory: newInventory
    });
    
    toast({
      title: "Предмет продан",
      description: `${item.name} продан за ${sellPrice} ELL`,
    });
  };

  const handleOpenCardPack = async (item: Item) => {
    if (item.type === 'cardPack') {
      await openCardPack(item);
    }
  };

  return {
    selectedItems,
    setSelectedItems,
    balance,
    groupItems,
    handleSellItem,
    handleOpenCardPack,
    isOpening,
    revealedCard,
    showRevealModal,
    closeRevealModal
  };
};