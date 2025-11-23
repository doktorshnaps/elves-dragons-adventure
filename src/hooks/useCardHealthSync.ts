import { useEffect, useCallback } from 'react';
import { useCardInstances } from './useCardInstances';
import { useGameData } from './useGameData';
import { Card } from '@/types/cards';
import { useGameStore } from '@/stores/gameStore';

/**
 * Hook to sync card health from card_instances to game data
 * Ensures health is always accurate from database
 */
export const useCardHealthSync = (skipDuringBattle: boolean = false) => {
  const { cardInstances, loadCardInstances } = useCardInstances();
  const { gameData } = useGameData();
  const { activeBattleInProgress } = useGameStore();

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

  // Listen for card health updates and sync (SKIP during battle)
  useEffect(() => {
    if (skipDuringBattle && activeBattleInProgress) {
      console.log('⏸️ [useCardHealthSync] Skipping sync during active battle');
      return;
    }

    const handleHealthUpdate = () => {
      loadCardInstances();
    };

    window.addEventListener('cardInstanceHealthUpdate', handleHealthUpdate);
    return () => window.removeEventListener('cardInstanceHealthUpdate', handleHealthUpdate);
  }, [loadCardInstances, skipDuringBattle, activeBattleInProgress]);

  // Load instances only once on mount - removed redundant check
  useEffect(() => {
    // Instances will be loaded automatically by React Query
    // No need for manual load here
  }, []);

  // Auto-sync when card instances change - but SKIP during battle
  useEffect(() => {
    if (skipDuringBattle && activeBattleInProgress) {
      console.log('⏸️ [useCardHealthSync] Skipping auto-sync during active battle');
      return;
    }

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
  }, [cardInstances, gameData.cards, skipDuringBattle, activeBattleInProgress]);

  return {
    syncHealthFromInstances,
    cardInstances
  };
};