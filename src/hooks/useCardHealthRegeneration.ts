import { useEffect } from 'react';
import { Card } from '@/types/cards';
import { processCardsHealthRegeneration } from '@/utils/cardHealthUtils';

interface UseCardHealthRegenerationProps {
  cards: Card[];
  onCardsUpdate: (cards: Card[]) => void;
}

export const useCardHealthRegeneration = ({ cards, onCardsUpdate }: UseCardHealthRegenerationProps) => {
  useEffect(() => {
    // Process health regeneration immediately when cards change
    const processRegeneration = () => {
      const updatedCards = processCardsHealthRegeneration(cards);
      
      // Check if any cards actually changed
      const hasChanges = updatedCards.some((card, index) => {
        const originalCard = cards[index];
        return card.currentHealth !== originalCard?.currentHealth ||
               card.lastHealTime !== originalCard?.lastHealTime;
      });
      
      if (hasChanges) {
        onCardsUpdate(updatedCards);
      }
    };

    // Process once immediately
    processRegeneration();

    // Set up interval to process every minute (for better performance)
    const interval = setInterval(processRegeneration, 60 * 1000);

    return () => clearInterval(interval);
  }, [cards, onCardsUpdate]);
};