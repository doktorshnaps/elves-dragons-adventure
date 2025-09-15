import { useEffect, useCallback } from 'react';
import { useCardInstances } from './useCardInstances';
import { useGameData } from './useGameData';
import { Card } from '@/types/cards';

const HEAL_INTERVAL = 60 * 1000; // 1 минута
const HEAL_RATE = 1; // 1 HP за минуту

export const useCardInstanceSync = () => {
  const { cardInstances, updateCardHealth, createCardInstance, deleteCardInstanceByTemplate } = useCardInstances();
  const { gameData, updateGameData } = useGameData();

  // Создание экземпляров для карт, которых нет в базе
  const syncCardsToInstances = useCallback(async () => {
    if (!gameData.cards || !cardInstances) return;

    const cards = gameData.cards as Card[];
    const existingInstanceIds = new Set(cardInstances.map(ci => ci.card_template_id));
    
    console.log('🔄 Checking cards for instances:', {
      totalCards: cards.length,
      existingInstances: existingInstanceIds.size,
      cardIds: cards.map(c => c.id),
      instanceIds: Array.from(existingInstanceIds)
    });

    for (const card of cards) {
      if (!existingInstanceIds.has(card.id)) {
        console.log(`🆕 Creating instance for card: ${card.name} (${card.id})`);
        const cardType = card.type === 'pet' ? 'dragon' : 'hero';
        await createCardInstance(card, cardType);
      }
    }
  }, [gameData.cards, cardInstances, createCardInstance]);

  // Синхронизация здоровья карт с экземплярами
  const syncHealthFromInstances = useCallback(() => {
    if (!gameData.cards || !cardInstances.length) return;

    const cards = gameData.cards as Card[];
    const instancesById = new Map(cardInstances.map(ci => [ci.card_template_id, ci]));
    
    console.log('🔄 Syncing health from instances:', {
      cardsCount: cards.length,
      instancesCount: cardInstances.length,
      mappedInstances: Array.from(instancesById.keys())
    });
    
    let hasChanges = false;
    const updatedCards = cards.map(card => {
      const instance = instancesById.get(card.id);
      if (instance && 
          (card.currentHealth !== instance.current_health || 
           card.lastHealTime !== new Date(instance.last_heal_time).getTime())) {
        console.log(`💊 Updating health for ${card.name}: ${card.currentHealth} -> ${instance.current_health}`);
        hasChanges = true;
        return {
          ...card,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime()
        };
      } else if (!instance) {
        console.log(`⚠️ No instance found for card: ${card.name} (${card.id})`);
      }
      return card;
    });

    if (hasChanges) {
      console.log('🔄 Updating game data with synced health');
      updateGameData({ cards: updatedCards });
      
      // Persist for legacy components and local sessions
      localStorage.setItem('gameCards', JSON.stringify(updatedCards));
      
      // Dispatch global events for immediate UI sync
      window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: updatedCards } }));
      window.dispatchEvent(new CustomEvent('cardsHealthUpdate', { detail: { cards: updatedCards } }));
    }
  }, [gameData.cards, cardInstances, updateGameData]);

  // Обработка регенерации здоровья
  const processHealthRegeneration = useCallback(async () => {
    if (!cardInstances.length) return;

    const now = Date.now();
    
    for (const instance of cardInstances) {
      if (instance.current_health >= instance.max_health) continue;
      
      const lastHealTime = new Date(instance.last_heal_time).getTime();
      const timeDiff = now - lastHealTime;
      
      if (timeDiff >= HEAL_INTERVAL) {
        const healsToApply = Math.floor(timeDiff / HEAL_INTERVAL);
        const newHealth = Math.min(
          instance.max_health,
          instance.current_health + (healsToApply * HEAL_RATE)
        );
        
        if (newHealth > instance.current_health) {
          const newHealTime = new Date(lastHealTime + (healsToApply * HEAL_INTERVAL)).toISOString();
          await updateCardHealth(instance.id, newHealth, newHealTime);
        }
      }
    }
  }, [cardInstances, updateCardHealth]);

  // Применение урона к экземпляру по ID карты
  const applyDamageToCard = useCallback(async (cardId: string, damage: number) => {
    const instance = cardInstances.find(ci => ci.card_template_id === cardId);
    if (instance) {
      const newHealth = Math.max(0, instance.current_health - damage);
      await updateCardHealth(instance.id, newHealth);
      
      // Dispatch event for immediate UI feedback
      const event = new CustomEvent('cardHealthChanged', {
        detail: { 
          card: { ...instance.card_data, currentHealth: newHealth },
          damage 
        }
      });
      window.dispatchEvent(event);
    }
  }, [cardInstances, updateCardHealth]);

  // Синхронизация при изменении данных
  useEffect(() => {
    syncCardsToInstances();
  }, [syncCardsToInstances]);

  useEffect(() => {
    syncHealthFromInstances();
  }, [syncHealthFromInstances]);

  // Очистка экземпляров, которых больше нет в колоде (например, после апгрейда/сжигания)
  useEffect(() => {
    if (!gameData.cards || !cardInstances.length) return;
    const cards = gameData.cards as Card[];
    const ids = new Set(cards.map(c => c.id));

    const toRemove = cardInstances.filter(inst => !ids.has(inst.card_template_id));
    if (toRemove.length > 0) {
      toRemove.forEach(inst => deleteCardInstanceByTemplate(inst.card_template_id));
    }
  }, [gameData.cards, cardInstances, deleteCardInstanceByTemplate]);

  // Таймер для регенерации здоровья ОТКЛЮЧЕН - здоровье не должно восстанавливаться автоматически
  // useEffect(() => {
  //   const interval = setInterval(processHealthRegeneration, HEAL_INTERVAL);
  //   
  //   // Запуск сразу
  //   setTimeout(processHealthRegeneration, 1000);
  //   
  //   return () => clearInterval(interval);
  // }, [processHealthRegeneration]);

  // Слушатель событий обновления здоровья
  useEffect(() => {
    const handleHealthUpdate = (e: CustomEvent<{ instanceId: string; currentHealth: number; lastHealTime?: string }>) => {
      // Обновление произошло, синхронизируем с gameData
      syncHealthFromInstances();
    };

    window.addEventListener('cardInstanceHealthUpdate', handleHealthUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cardInstanceHealthUpdate', handleHealthUpdate as EventListener);
    };
  }, [syncHealthFromInstances]);

  return {
    applyDamageToCard,
    processHealthRegeneration
  };
};