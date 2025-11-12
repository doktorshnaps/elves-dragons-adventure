import { useState } from "react";
import { Item } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { getItemPrice } from "@/utils/itemUtils";
import { useCardPackOpening } from "@/hooks/useCardPackOpening";
import { GroupedItem } from "./types";
import { shopItems } from "../../shop/types";
import { useGameData } from "@/hooks/useGameData";
import { workerImagesByName } from "@/constants/workerImages";
import { itemImagesByName } from "@/constants/itemImages";

export const useInventoryLogic = (initialInventory: Item[]) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedPackItem, setSelectedPackItem] = useState<Item | null>(null);
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
    totalCards,
    skipAnimations,
    skipAllAnimations
  } = useCardPackOpening();
  const balance = gameData.balance;

  const getItemImage = (item: Item) => {
    console.log('🖼️ getItemImage called for:', item.name, 'with image:', item.image);
    
    // Для рабочих сначала проверяем mapping по имени
    if (item.type === 'worker' && workerImagesByName[item.name]) {
      return workerImagesByName[item.name];
    }
    
    // Проверяем централизованный маппинг изображений предметов
    if (itemImagesByName[item.name]) {
      console.log('🖼️ Found image in itemImagesByName for:', item.name);
      return itemImagesByName[item.name];
    }
    
    // Ищем в shopItems по имени
    const shopItem = shopItems.find(shopItem => shopItem.name === item.name);
    console.log('🖼️ Fallback to shopItem image:', shopItem?.image || 'none');
    return shopItem?.image || '';
  };

const groupItems = (items: Item[]): GroupedItem[] => {
    // Фильтруем null и undefined значения перед группировкой
    const validItems = items.filter(item => item != null && typeof item === 'object');
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

  const handleSellItem = async (item: Item) => {
    // Используем sell_price из item_templates, если он определен
    const sellPrice = item.sell_price !== undefined ? item.sell_price : Math.floor(getItemPrice(item) * 0.7);
    const newBalance = balance + sellPrice;
    
    // Обновляем только баланс (предмет удаляется через useItemOperations)
    await updateGameData({
      balance: newBalance
    });
    
    toast({
      title: "Предмет продан",
      description: `${item.name} продан за ${sellPrice} ELL`,
    });
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