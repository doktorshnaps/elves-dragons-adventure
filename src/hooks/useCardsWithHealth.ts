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
      if (instance && instance.card_data) {
        return {
          ...card,
          // Здоровье и броня
          currentHealth: instance.current_health,
          currentDefense: instance.current_defense,
          maxDefense: instance.max_defense,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false,
          // Характеристики из card_data (приоритет над card)
          power: (instance.card_data as any).power ?? card.power,
          defense: (instance.card_data as any).defense ?? card.defense,
          health: (instance.card_data as any).health ?? card.health,
          magic: (instance.card_data as any).magic ?? card.magic
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
        return instance && instance.card_data ? {
          ...pair.hero,
          // Здоровье и броня
          currentHealth: instance.current_health,
          currentDefense: instance.current_defense,
          maxDefense: instance.max_defense,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false,
          // Характеристики из card_data
          power: (instance.card_data as any).power ?? pair.hero.power,
          defense: (instance.card_data as any).defense ?? pair.hero.defense,
          health: (instance.card_data as any).health ?? pair.hero.health,
          magic: (instance.card_data as any).magic ?? pair.hero.magic
        } : pair.hero;
      })() : undefined,
      dragon: pair.dragon ? (() => {
        const instance = instancesMap.get(pair.dragon.id);
        return instance && instance.card_data ? {
          ...pair.dragon,
          // Здоровье и броня
          currentHealth: instance.current_health,
          currentDefense: instance.current_defense,
          maxDefense: instance.max_defense,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false,
          // Характеристики из card_data
          power: (instance.card_data as any).power ?? pair.dragon.power,
          defense: (instance.card_data as any).defense ?? pair.dragon.defense,
          health: (instance.card_data as any).health ?? pair.dragon.health,
          magic: (instance.card_data as any).magic ?? pair.dragon.magic
        } : pair.dragon;
      })() : undefined
    }));
  }, [gameData.selectedTeam, cardInstances]);

  return {
    cardsWithHealth,
    selectedTeamWithHealth
  };
};