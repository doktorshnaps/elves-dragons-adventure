import { useState } from 'react';
import { Item } from "@/types/inventory";
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { generateCard } from '@/utils/cardUtils';

export const useCardPackOpening = () => {
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCard, setRevealedCard] = useState<CardType | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);

  const openCardPack = async (packItem: Item): Promise<CardType | null> => {
    if (packItem.type !== 'cardPack' || isOpening) return null;

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

      // Показываем модальное окно с картой
      setRevealedCard(newCard);
      setShowRevealModal(true);

      return newCard;
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось открыть колоду карт",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsOpening(false);
    }
  };

  const closeRevealModal = () => {
    setShowRevealModal(false);
    setRevealedCard(null);
  };

  return {
    openCardPack,
    isOpening,
    revealedCard,
    showRevealModal,
    closeRevealModal
  };
};