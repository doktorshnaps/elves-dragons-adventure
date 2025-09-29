import { useState } from "react";
import { Item } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { getItemPrice } from "@/utils/itemUtils";
import { useCardPackOpening } from "@/hooks/useCardPackOpening";
import { GroupedItem } from "./types";
import { shopItems } from "../../shop/types";
import { useGameData } from "@/hooks/useGameData";
import { workerImagesByName } from "@/constants/workerImages";
import woodChunksImg from "@/assets/items/wood-chunks.jpeg";
import magicalRootsImg from "@/assets/items/magical-roots.jpeg";
import rockStonesImg from "@/assets/items/rock-stones.jpeg";
import blackCrystalsImg from "@/assets/items/black-crystals.jpeg";
import illusionManuscriptImg from "@/assets/items/illusion-manuscript.png";
import darkMonocleImg from "@/assets/items/dark-monocle.png";
import etherVineImg from "@/assets/items/ether-vine.png";
import dwarvenTongsImg from "@/assets/items/dwarven-tongs.png";
import healingOilImg from "@/assets/items/healing-oil.png";
import shimmeringCrystalImg from "@/assets/items/shimmering-crystal.png";

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
    totalCards
  } = useCardPackOpening();
  const balance = gameData.balance;

  const getItemImage = (item: Item) => {
    console.log('🖼️ getItemImage called for:', item.name, 'with image:', item.image);
    
    // Для рабочих сначала проверяем mapping по имени
    if (item.type === 'worker' && workerImagesByName[item.name]) {
      return workerImagesByName[item.name];
    }
    
    // Новые предметы - правильные импорты изображений
    const newItemImages: Record<string, string> = {
      'Древесные чурки': woodChunksImg,
      'Остатки магических корней': magicalRootsImg,
      'Камни горной породы': rockStonesImg,
      'Черные кристаллы земляных духов': blackCrystalsImg,
      'Манускрипт иллюзорных откровений': illusionManuscriptImg,
      'Магический монокль тьмы': darkMonocleImg,
      'Плетёная жила эфирной лозы': etherVineImg,
      'Клещи из серебра древних гномов': dwarvenTongsImg,
      'Масло Целительного Прощения': healingOilImg,
      'Мерцающий мерный кристалл': shimmeringCrystalImg
    };
    
    if (newItemImages[item.name]) {
      console.log('🖼️ Found image in newItemImages for:', item.name);
      return newItemImages[item.name];
    }
    
    // Если у предмета есть изображение, используем его
    if (item.image) {
      console.log('🖼️ Using item.image:', item.image);
      return item.image;
    }
    
    // Ищем в shopItems по имени
    const shopItem = shopItems.find(shopItem => shopItem.name === item.name);
    console.log('🖼️ Fallback to shopItem image:', shopItem?.image || 'none');
    return shopItem?.image || '';
  };

const groupItems = (items: Item[]): GroupedItem[] => {
    // Фильтруем null и undefined значения перед группировкой
    const validItems = items.filter(item => item != null && typeof item === 'object');
      return validItems.reduce<GroupedItem[]>((acc, item) => {
      // Яйца драконов и рабочие НЕ группируем — у каждого свой таймер/уникальный ID
      if (item.type === 'dragon_egg' || item.type === 'worker') {
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
      setSelectedPackItem(item);
      setShowQuantityModal(true);
      return false; // Modal will handle the opening
    }
    return false;
  };

  const handleQuantityConfirm = async (quantity: number) => {
    if (!selectedPackItem) return;
    
    const allPacks = (gameData.inventory || []).filter(i => i.type === 'cardPack' && i.name === selectedPackItem.name);
    const available = allPacks.length;
    const shouldClose = quantity >= available;
    
    await openCardPacks(selectedPackItem, quantity);
    await loadGameData();
    
    setSelectedPackItem(null);
    return shouldClose;
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
    handleQuantityConfirm
  };
};