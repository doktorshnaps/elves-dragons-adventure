import { useEffect, useCallback } from 'react';
import { Card } from '@/types/cards';
import { initializeCardHealth, processCardsHealthRegeneration } from '@/utils/cardHealthUtils';

interface UseCardHealthSyncProps {
  cards: Card[];
  onCardsUpdate: (cards: Card[]) => void;
}

/**
 * Hook for synchronizing card health across all game components
 * Ensures health changes persist across different game stages
 */
export const useCardHealthSync = ({ cards, onCardsUpdate }: UseCardHealthSyncProps) => {
  
  const syncCardsHealth = useCallback((updatedCards: Card[]) => {
    // Update localStorage for persistence
    localStorage.setItem('gameCards', JSON.stringify(updatedCards));
    
    // Dispatch global event for immediate UI sync
    const event = new CustomEvent('cardsUpdate', { 
      detail: { cards: updatedCards }
    });
    window.dispatchEvent(event);
    
    onCardsUpdate(updatedCards);
  }, [onCardsUpdate]);

  // Initialize health for all cards on first load
  useEffect(() => {
    if (cards && cards.length > 0) {
      const needsInit = cards.some(card => card.currentHealth === undefined || card.lastHealTime === undefined);
      
      if (needsInit) {
        const initializedCards = cards.map(initializeCardHealth);
        syncCardsHealth(initializedCards);
      }
    }
  }, []); // Only run once on mount

  // Listen for health changes from battles/dungeons
  useEffect(() => {
    const handleCardHealthChange = (e: CustomEvent<{ card: Card; damage: number }>) => {
      const { card: damagedCard } = e.detail;
      
      const updatedCards = cards.map(card => 
        card.id === damagedCard.id ? damagedCard : card
      );
      
      syncCardsHealth(updatedCards);
    };

    const handleCardsHealthUpdate = (e: CustomEvent<{ cards: Card[] }>) => {
      if (e.detail?.cards) {
        syncCardsHealth(e.detail.cards);
      }
    };

    window.addEventListener('cardHealthChanged', handleCardHealthChange as EventListener);
    window.addEventListener('cardsHealthUpdate', handleCardsHealthUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cardHealthChanged', handleCardHealthChange as EventListener);
      window.removeEventListener('cardsHealthUpdate', handleCardsHealthUpdate as EventListener);
    };
  }, [cards, syncCardsHealth]);

  // Process health regeneration every minute
  useEffect(() => {
    const processRegeneration = () => {
      if (!cards || cards.length === 0) return;
      
      const updatedCards = processCardsHealthRegeneration(cards);
      
      // Check if any cards actually regenerated health
      const hasChanges = updatedCards.some((card, index) => {
        const originalCard = cards[index];
        return card.currentHealth !== originalCard?.currentHealth ||
               card.lastHealTime !== originalCard?.lastHealTime;
      });
      
      if (hasChanges) {
        syncCardsHealth(updatedCards);
      }
    };

    // Set up interval for health regeneration
    const interval = setInterval(processRegeneration, 60 * 1000);
    
    // Process immediately on mount if enough time has passed
    setTimeout(processRegeneration, 1000);

    return () => clearInterval(interval);
  }, [cards, syncCardsHealth]);
};