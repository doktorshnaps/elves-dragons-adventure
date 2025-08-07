import { useState } from 'react';
import { Item } from "@/types/inventory";
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { generateCard } from '@/utils/cardUtils';

export const useCardPackOpening = () => {
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();
  const [isOpening, setIsOpening] = useState(false);

  const openCardPack = async (packItem: Item) => {
    if (packItem.type !== 'cardPack' || isOpening) return;

    setIsOpening(true);

    try {
      // Генерируем случайную карту
      const newCard = generateCard(Math.random() > 0.5 ? 'character' : 'pet');
      
      // Удаляем колоду из инвентаря и добавляем карту
      const updatedInventory = gameData.inventory?.filter(item => item.id !== packItem.id) || [];
      const updatedCards = [...gameData.cards, newCard];
      
      await updateGameData({
        inventory: updatedInventory,
        cards: updatedCards
      });

      toast({
        title: "Карта получена!",
        description: `Из колоды выпала карта: ${newCard.name} (${newCard.type === 'character' ? 'Герой' : 'Дракон'})`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось открыть колоду карт",
        variant: "destructive",
      });
    } finally {
      setIsOpening(false);
    }
  };

  return {
    openCardPack,
    isOpening
  };
};