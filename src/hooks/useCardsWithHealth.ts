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

  // КРИТИЧНО: Строим карты НАПРЯМУЮ из card_instances по UUID
  // Не используем gameData.cards как источник - это старые кэшированные данные
  const cardsWithHealth = useMemo(() => {
    // Создаем Map по UUID для быстрого доступа
    const instancesById = new Map(cardInstances.map(ci => [ci.id, ci]));
    
    // Строим карты из card_instances - каждый instance = уникальная карта
    return cardInstances
      .filter(ci => ci.card_type === 'hero' || ci.card_type === 'dragon')
      .map(instance => {
        const cardData = instance.card_data as any;
        
        return {
          // UUID как основной ID
          id: instance.id,
          instanceId: instance.id,
          templateId: instance.card_template_id,
          
          // Данные из card_data
          name: cardData.name,
          type: cardData.type,
          faction: cardData.faction,
          rarity: cardData.rarity,
          image: cardData.image,
          
          // Характеристики из card_data (источник правды!)
          power: cardData.power,
          defense: cardData.defense,
          health: cardData.health,
          magic: cardData.magic,
          
          // Текущее здоровье и броня из instance
          currentHealth: instance.current_health,
          currentDefense: instance.current_defense,
          maxDefense: instance.max_defense,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          monster_kills: instance.monster_kills,
          isInMedicalBay: instance.is_in_medical_bay || false
        };
      });
  }, [cardInstances]);

  // КРИТИЧНО: selectedTeam с данными напрямую из card_instances по UUID
  const selectedTeamWithHealth = useMemo(() => {
    const selectedTeam = gameData.selectedTeam || [];
    
    // Map по UUID для быстрого доступа
    const instancesById = new Map(cardInstances.map(ci => [ci.id, ci]));
    
    return selectedTeam.map((pair: any) => ({
      hero: pair.hero ? (() => {
        // Ищем instance по UUID (id или instanceId)
        const heroId = pair.hero.instanceId || pair.hero.id;
        const instance = instancesById.get(heroId);
        
        if (instance && instance.card_data) {
          const cardData = instance.card_data as any;
          return {
            // UUID как основной ID
            id: instance.id,
            instanceId: instance.id,
            templateId: instance.card_template_id,
            
            // Данные из card_data
            name: cardData.name,
            type: cardData.type,
            faction: cardData.faction,
            rarity: cardData.rarity,
            image: cardData.image,
            
            // Характеристики из card_data
            power: cardData.power,
            defense: cardData.defense,
            health: cardData.health,
            magic: cardData.magic,
            
            // Текущее здоровье и броня
            currentHealth: instance.current_health,
            currentDefense: instance.current_defense,
            maxDefense: instance.max_defense,
            lastHealTime: new Date(instance.last_heal_time).getTime(),
            isInMedicalBay: instance.is_in_medical_bay || false
          };
        }
        return pair.hero;
      })() : undefined,
      
      dragon: pair.dragon ? (() => {
        // Ищем instance по UUID
        const dragonId = pair.dragon.instanceId || pair.dragon.id;
        const instance = instancesById.get(dragonId);
        
        if (instance && instance.card_data) {
          const cardData = instance.card_data as any;
          return {
            // UUID как основной ID
            id: instance.id,
            instanceId: instance.id,
            templateId: instance.card_template_id,
            
            // Данные из card_data
            name: cardData.name,
            type: cardData.type,
            faction: cardData.faction,
            rarity: cardData.rarity,
            image: cardData.image,
            
            // Характеристики
            power: cardData.power,
            defense: cardData.defense,
            health: cardData.health,
            magic: cardData.magic,
            
            // Текущее здоровье и броня
            currentHealth: instance.current_health,
            currentDefense: instance.current_defense,
            maxDefense: instance.max_defense,
            lastHealTime: new Date(instance.last_heal_time).getTime(),
            isInMedicalBay: instance.is_in_medical_bay || false
          };
        }
        return pair.dragon;
      })() : undefined
    }));
  }, [gameData.selectedTeam, cardInstances]);

  return {
    cardsWithHealth,
    selectedTeamWithHealth
  };
};
