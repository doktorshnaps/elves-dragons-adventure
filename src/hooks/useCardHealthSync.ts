import { useEffect, useCallback } from 'react';
import { useCardInstances } from './useCardInstances';
import { useGameData } from './useGameData';
import { Card } from '@/types/cards';

/**
 * Hook to sync card health from card_instances to game data
 * Ensures health is always accurate from database
 */
export const useCardHealthSync = () => {
  const { cardInstances, loadCardInstances } = useCardInstances();
  const { gameData } = useGameData();

  // Sync health from card_instances to cards in gameData
  const syncHealthFromInstances = useCallback(async () => {
    if (!cardInstances.length || !gameData.cards.length) return;

    const instancesById = new Map(cardInstances.map(inst => [inst.card_template_id, inst]));
    let hasChanges = false;

    const updatedCards = gameData.cards.map((card: Card) => {
      const instance = instancesById.get(card.id);
      if (instance && (instance.current_health !== card.currentHealth || instance.current_defense !== card.currentDefense)) {
        hasChanges = true;
        return {
          ...card,
          currentHealth: instance.current_health,
          currentDefense: instance.current_defense,
          maxDefense: instance.max_defense,
          lastHealTime: new Date(instance.last_heal_time).getTime()
        };
      }
      return card;
    });

    if (hasChanges) {
      try {
        localStorage.setItem('gameCards', JSON.stringify(updatedCards));
        
        // Debounce the localStorage sync to avoid conflicts with team selection
        setTimeout(() => {
          // Notify other components; no RPC write to avoid spam
          window.dispatchEvent(new CustomEvent('cardsUpdate', {
            detail: { cards: updatedCards }
          }));
        }, 100);
      } catch (error) {
        console.warn('Failed to sync card health to localStorage:', error);
      }
    }
  }, [cardInstances, gameData.cards]);

  // Listen for card health updates and sync
  useEffect(() => {
    const handleHealthUpdate = () => {
      loadCardInstances();
    };

    window.addEventListener('cardInstanceHealthUpdate', handleHealthUpdate);
    return () => window.removeEventListener('cardInstanceHealthUpdate', handleHealthUpdate);
  }, [loadCardInstances]);

  // Load instances only if needed (on mount and when instances are empty)
  useEffect(() => {
    if (cardInstances.length === 0) {
      loadCardInstances();
    }
  }, []);

  // Auto-sync when card instances change - but only if there are actual changes
  useEffect(() => {
    // Only sync if we have both instances and cards
    if (cardInstances.length > 0 && gameData.cards.length > 0) {
      const instancesById = new Map(cardInstances.map(inst => [inst.card_template_id, inst]));
      
      // Check if there are actual differences before syncing
      const hasChanges = gameData.cards.some((card: Card) => {
        const instance = instancesById.get(card.id);
        return instance && (
          instance.current_health !== card.currentHealth || 
          instance.current_defense !== card.currentDefense
        );
      });
      
      if (hasChanges) {
        syncHealthFromInstances();
      }
    }
  }, [cardInstances, gameData.cards]);

  return {
    syncHealthFromInstances,
    cardInstances
  };
};