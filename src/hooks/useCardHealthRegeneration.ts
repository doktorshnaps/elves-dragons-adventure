import { useEffect, useCallback } from 'react';
import { Card } from '@/types/cards';
import { processCardsHealthRegeneration, initializeCardHealth } from '@/utils/cardHealthUtils';

interface UseCardHealthRegenerationProps {
  cards: Card[];
  onCardsUpdate: (cards: Card[]) => void;
}

export const useCardHealthRegeneration = ({ cards, onCardsUpdate }: UseCardHealthRegenerationProps) => {
  const processRegeneration = useCallback(() => {
    if (!cards || cards.length === 0) return;
    
    // Initialize health for cards that don't have it
    const initializedCards = cards.map(initializeCardHealth);
    
    // Process health regeneration
    const updatedCards = processCardsHealthRegeneration(initializedCards);
    
    // Check if any cards actually changed
    const hasChanges = updatedCards.some((card, index) => {
      const originalCard = cards[index];
      return card.currentHealth !== originalCard?.currentHealth ||
             card.lastHealTime !== originalCard?.lastHealTime;
    });
    
    if (hasChanges) {
      onCardsUpdate(updatedCards);
      
      // Dispatch global event to synchronize across components
      const event = new CustomEvent('cardsHealthUpdate', { 
        detail: { cards: updatedCards }
      });
      window.dispatchEvent(event);
    }
  }, [cards, onCardsUpdate]);

  useEffect(() => {
    // Process once immediately
    processRegeneration();

    // Set up interval to process every minute (for better performance)
    const interval = setInterval(processRegeneration, 60 * 1000);

    return () => clearInterval(interval);
  }, [processRegeneration]);

  // Listen for cross-app health updates
  useEffect(() => {
    const handleHealthUpdate = (e: CustomEvent<{ cards: Card[] }>) => {
      if (e.detail?.cards) {
        onCardsUpdate(e.detail.cards);
      }
    };

    window.addEventListener('cardsHealthUpdate', handleHealthUpdate as EventListener);
    return () => {
      window.removeEventListener('cardsHealthUpdate', handleHealthUpdate as EventListener);
    };
  }, [onCardsUpdate]);
};