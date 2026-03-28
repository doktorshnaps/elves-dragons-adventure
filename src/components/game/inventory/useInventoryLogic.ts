import { useState } from "react";
import { Item } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { getItemPrice } from "@/utils/itemUtils";
import { useCardPackOpening } from "@/hooks/useCardPackOpening";
import { GroupedItem } from "./types";
import { shopItems } from "../../shop/types";
import { useGameData } from "@/hooks/useGameData";
import { itemImagesByName } from "@/constants/itemImages";
import { useItemOperations } from "@/hooks/useItemOperations";

export const useInventoryLogic = (initialInventory: Item[]) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedPackItem, setSelectedPackItem] = useState<Item | null>(null);
  const { gameData, updateGameData, loadGameData } = useGameData();
  const { sellItem, sellMultipleItems } = useItemOperations();
  const { 
    openCardPack,
    openCardPacks,
    isOpening,
    revealedCard,
    showRevealModal,
    closeRevealModal,
    showNextCard,
    currentCardIndex,
    totalCards,
    skipAnimations,
    skipAllAnimations,
    cardQueue
  } = useCardPackOpening();
  const balance = gameData.balance;
  const mgtBalance = gameData.mgtBalance || 0;

  const getItemImage = (item: Item) => {
    // Use image_url from database if available
    if (item.image_url) {
      return item.image_url;
    }
    
    // Проверяем централизованный маппинг изображений предметов
    if (itemImagesByName[item.name]) {
      return itemImagesByName[item.name];
    }
    
    // Ищем в shopItems по имени
    const shopItem = shopItems.find(shopItem => shopItem.name === item.name);
    return shopItem?.image || '';
  };

const groupItems = (items: Item[]): GroupedItem[] => {
    console.log('🔧 [groupItems] Input items:', items.length);
    
    // Фильтруем null и undefined значения перед группировкой
    const validItems = items.filter(item => item != null && typeof item === 'object');
    
    console.log('🔧 [groupItems] Valid items after filter:', validItems.length);
    
    const grouped = validItems.reduce<GroupedItem[]>((acc, item) => {
      // Группируем предметы по имени и статусу экипировки (если есть)
      const existingGroup = acc.find(
        group => 
          group.name === item.name && 
          group.items[0]?.equipped === item.equipped
      );

      if (existingGroup) {
        existingGroup.count += 1;
        existingGroup.items.push(item);
      } else {
        const newGroup = {
          name: item.name,
          type: item.type,
          value: item.value,
          count: 1,
          items: [item],
          image: getItemImage(item),
          image_url: item.image_url // Use image_url from database
        };
        console.log('📦 [groupItems] Creating new group:', {
          name: newGroup.name,
          type: newGroup.type,
          image_url: newGroup.image_url,
          image: newGroup.image,
          item_id: (item as any).item_id
        });
        acc.push(newGroup);
      }

      return acc;
    }, []);

    console.log('🔧 [groupItems] Grouped items:', grouped.length, 'groups');
    console.log('🔧 [groupItems] CardPacks group:', grouped.find(g => g.type === 'cardPack'));

    // Сортируем: колоды карт всегда на первом месте, остальные по убыванию количества
    return grouped.sort((a, b) => {
      const aIsCardPack = a.type === 'cardPack';
      const bIsCardPack = b.type === 'cardPack';
      
      // Если оба или ни один не являются колодами карт
      if (aIsCardPack === bIsCardPack) {
        // Сортируем по количеству (от большего к меньшему)
        return b.count - a.count;
      }
      
      // Колода карт всегда перед остальными
      return aIsCardPack ? -1 : 1;
    });
  };

  const handleSellItem = async (item: Item, quantity: number = 1) => {
    if (quantity === 1) {
      // Продаем один предмет
      await sellItem(item);
    } else {
      // Продаем несколько предметов - цена берется из реальных экземпляров внутри sellMultipleItems
      await sellMultipleItems(item.name, quantity);
    }
  };
  const handleOpenCardPack = async (item: Item): Promise<boolean> => {
    console.log('🎫 handleOpenCardPack CALLED', { itemName: item.name, itemType: item.type });
    if (item.type === 'cardPack') {
      setSelectedPackItem(item);
      setShowQuantityModal(true);
      console.log('✅ Modal opened for pack:', item.name);
      return false; // Modal will handle the opening
    }
    console.log('❌ Not a cardPack:', item.type);
    return false;
  };

  const handleQuantityConfirm = async (quantity: number) => {
    console.log('📋 handleQuantityConfirm CALLED', { 
      quantity, 
      selectedPackItem,
      hasSelectedPackItem: !!selectedPackItem 
    });
    
    if (!selectedPackItem) {
      console.log('❌ No selectedPackItem, returning');
      return;
    }
    
    // Card packs are now in item_instances, not gameData.inventory
    console.log('🎒 Opening pack from item_instances:', { quantity, packName: selectedPackItem.name });
    
    await openCardPacks(selectedPackItem, quantity);
    await loadGameData();
    
    // Закрываем модальное окно после открытия
    setShowQuantityModal(false);
    setSelectedPackItem(null);
  };
  return {
    selectedItems,
    setSelectedItems,
    balance,
    mgtBalance,
    groupItems,
    handleSellItem,
    handleOpenCardPack,
    isOpening,
    revealedCard,
    showRevealModal,
    closeRevealModal,
    showNextCard,
    currentCardIndex,
    totalCards,
    showQuantityModal,
    setShowQuantityModal,
    selectedPackItem,
    handleQuantityConfirm,
    skipAnimations,
    skipAllAnimations
  };
};