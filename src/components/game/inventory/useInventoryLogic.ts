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
  const { gameData, updateGameData, loadGameData } = useGameData();
  const { 
    openCardPack,
    openCardPacks,
    isOpening,
    revealedCard,
    showRevealModal,
    closeRevealModal,
    showNextCard,
    currentCardIndex,
    totalCards
  } = useCardPackOpening();
  const balance = gameData.balance;

  const getItemImage = (item: Item) => {
    if (item.image) return item.image;
    const shopItem = shopItems.find(shopItem => shopItem.name === item.name);
    return shopItem?.image || '';
  };

const groupItems = (items: Item[]): GroupedItem[] => {
    return items.filter(item => item !== null && item !== undefined).reduce<GroupedItem[]>((acc, item) => {
      // Яйца драконов НЕ группируем — у каждого свой таймер инкубации
      if (item.type === 'dragon_egg') {
        acc.push({
          name: item.name,
          type: item.type,
          value: item.value,
          count: 1,
          items: [item],
          image: getItemImage(item)
        });
        return acc;
      }

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
    // Safety: verify the item still exists in current inventory to avoid selling non-existent packs
    const currentInv = (gameData.inventory || []);
    const exists = currentInv.some(i => i.id === item.id);
    if (!exists) {
      toast({
        title: 'Нельзя продать',
        description: 'Этот предмет уже отсутствует в вашем инвентаре',
        variant: 'destructive'
      });
      return;
    }

    // Additional rule: prevent selling card packs if there are none left (should be covered by exists check)
    if (item.type === 'cardPack') {
      const packsLeft = currentInv.filter(i => i.type === 'cardPack').length;
      if (packsLeft < 1) {
        toast({
          title: 'Нет колод',
          description: 'У вас нет закрытых колод для продажи',
          variant: 'destructive'
        });
        return;
      }
    }

    const price = getItemPrice(item);
    const sellPrice = Math.floor(price * 0.7);
    const newBalance = balance + sellPrice;
    
    const newInventory = currentInv.filter(i => i.id !== item.id);
    
    await updateGameData({
      balance: newBalance,
      inventory: newInventory
    });
    
    toast({
      title: "Предмет продан",
      description: `${item.name} продан за ${sellPrice} ELL`,
    });
  };
  const handleOpenCardPack = async (item: Item): Promise<boolean> => {
    if (item.type === 'cardPack') {
      console.log('🎴 Opening card pack:', item.name);
      // Ask for quantity to open
      const allPacks = (gameData.inventory || []).filter(i => i && i.type === 'cardPack' && i.name === item.name);
      const available = allPacks.length;
      const raw = window.prompt(`Сколько колод открыть? Доступно: ${available}`, '1');
      if (!raw) return false;
      const requested = Math.max(1, Math.min(available, Number.parseInt(raw, 10) || 0));
      if (!requested) return false;
      const shouldClose = requested >= available;
      console.log('🎴 Opening', requested, 'packs');
      // Use new multi-open API
      await openCardPacks(item, requested);
      console.log('🎴 Card packs opened, reloading game data');
      await loadGameData();
      return shouldClose;
    }
    return false;
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
    closeRevealModal,
    showNextCard,
    currentCardIndex,
    totalCards
  };
};