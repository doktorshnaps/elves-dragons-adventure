import { useState, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { useToast } from '@/hooks/use-toast';
import { useNormalizedCards } from '@/hooks/useNormalizedCards';
import { findMatchingCards, normalizeCards } from '@/utils/cardNormalization';

export const useCardSelection = (cards: CardType[]) => {
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const { toast } = useToast();
  const { normalized } = useNormalizedCards(cards);

  const handleCardSelect = useMemo(() => {
    return (card: CardType, groupCount: number) => {
      // Если в группе меньше 2 карт, игнорируем выбор
      if (groupCount < 2) {
        return;
      }

      // Находим все карты в группе через нормализованную структуру (O(n) но оптимизированно)
      const sameCards = findMatchingCards(normalized, card);

      // Если карты уже выбраны, снимаем выбор
      if (selectedCards.length === 2) {
        setSelectedCards([]);
        return;
      }

      // Автоматически выбираем первые две карты из стопки
      setSelectedCards([sameCards[0], sameCards[1]]);
    };
  }, [normalized, selectedCards.length]);

  return {
    selectedCards,
    setSelectedCards,
    handleCardSelect
  };
};