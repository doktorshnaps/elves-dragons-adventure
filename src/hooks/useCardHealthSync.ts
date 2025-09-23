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
      if (instance && instance.current_health !== card.currentHealth) {
        hasChanges = true;
        return {
          ...card,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime()
        };
      }
      return card;
    });

    if (hasChanges) {
      console.log('🔄 Syncing card health from card_instances (local UI update only)');
      try {
        localStorage.setItem('gameCards', JSON.stringify(updatedCards));
      } catch {}
      // Notify other components; no RPC write to avoid spam
      window.dispatchEvent(new CustomEvent('cardsUpdate', {
        detail: { cards: updatedCards }
      }));
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

  // Load instances on mount to ensure initial sync
  useEffect(() => {
    loadCardInstances();
  }, [loadCardInstances]);

  // Auto-sync when card instances change
  useEffect(() => {
    syncHealthFromInstances();
  }, [syncHealthFromInstances]);

  return {
    syncHealthFromInstances,
    cardInstances
  };
};