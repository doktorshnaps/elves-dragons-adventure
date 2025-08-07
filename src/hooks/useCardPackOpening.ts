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
      // Проверяем наличие колоды в инвентаре и удаляем одну штуку
      let removed = false;
      const { inventory: updatedInventory } = (() => {
        const inv = [...(gameData.inventory || [])];
        const idx = inv.findIndex(item => item.id === packItem.id);
        if (idx !== -1) {
          inv.splice(idx, 1);
          removed = true;
          return { inventory: inv };
        }
        // Fallback: remove one matching pack if IDs are not unique
        const sameIndex = inv.findIndex(item => item.type === packItem.type && item.name === packItem.name);
        if (sameIndex !== -1) {
          inv.splice(sameIndex, 1);
          removed = true;
        }
        return { inventory: inv };
      })();

      if (!removed) {
        toast({
          title: "Нет колод",
          description: "В инвентаре нет доступных колод для открытия",
          variant: "destructive",
        });
        return null;
      }

      // Генерируем случайную карту только если колода действительно списана
      const newCard = generateCard(Math.random() > 0.5 ? 'character' : 'pet');
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