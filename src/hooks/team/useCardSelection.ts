import { useState } from 'react';
import { Card as CardType } from "@/types/cards";
import { useToast } from '@/hooks/use-toast';

export const useCardSelection = (cards: CardType[]) => {
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const { toast } = useToast();

  const handleCardSelect = (card: CardType, groupCount: number) => {
    // Если в группе меньше 2 карт, игнорируем выбор
    if (groupCount < 2) {
      return;
    }

    // Находим все карты в группе
    const sameCards = cards.filter(c => 
      c.name === card.name && 
      c.rarity === card.rarity && 
      c.type === card.type && 
      c.faction === card.faction
    );

    // Если карты уже выбраны, снимаем выбор
    if (selectedCards.length === 2) {
      setSelectedCards([]);
      return;
    }

    // Автоматически выбираем первые две карты из стопки
    setSelectedCards([sameCards[0], sameCards[1]]);
  };

  return {
    selectedCards,
    setSelectedCards,
    handleCardSelect
  };
};