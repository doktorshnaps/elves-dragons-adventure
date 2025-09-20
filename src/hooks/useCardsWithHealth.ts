import { useMemo } from 'react';
import { useCardInstances } from './useCardInstances';
import { useGameData } from './useGameData';
import { Card } from '@/types/cards';

/**
 * Хук для получения карт с актуальным здоровьем из card_instances
 */
export const useCardsWithHealth = () => {
  const { gameData } = useGameData();
  const { cardInstances } = useCardInstances();

  const cardsWithHealth = useMemo(() => {
    const cards = gameData.cards || [];
    
    // Создаем мапу экземпляров для быстрого поиска
    const instancesMap = new Map(cardInstances.map(ci => [ci.card_template_id, ci]));
    
    return cards.map(card => {
      const instance = instancesMap.get(card.id);
      if (instance) {
        return {
          ...card,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false
        };
      }
      return card;
    });
  }, [gameData.cards, cardInstances]);

  const selectedTeamWithHealth = useMemo(() => {
    const selectedTeam = gameData.selectedTeam || [];
    const instancesMap = new Map(cardInstances.map(ci => [ci.card_template_id, ci]));
    
    return selectedTeam.map((pair: any) => ({
      hero: pair.hero ? (() => {
        const instance = instancesMap.get(pair.hero.id);
        return instance ? {
          ...pair.hero,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false
        } : pair.hero;
      })() : undefined,
      dragon: pair.dragon ? (() => {
        const instance = instancesMap.get(pair.dragon.id);
        return instance ? {
          ...pair.dragon,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false
        } : pair.dragon;
      })() : undefined
    }));
  }, [gameData.selectedTeam, cardInstances]);

  return {
    cardsWithHealth,
    selectedTeamWithHealth
  };
};