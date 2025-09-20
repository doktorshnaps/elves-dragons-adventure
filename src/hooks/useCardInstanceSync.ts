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

  // Создание экземпляров для рабочих из инвентаря
  const syncWorkersToInstances = useCallback(async () => {
    if (!gameData.inventory || !cardInstances) return;

    const workers = (gameData.inventory as any[]).filter(item => 
      item?.type === 'worker' || (item?.stats?.workDuration != null && item?.name)
    );
    const existingInstanceIds = new Set(cardInstances.map(ci => ci.card_template_id));
    
    console.log('🔧 Checking workers for instances:', {
      totalWorkers: workers.length,
      existingInstances: existingInstanceIds.size,
      workerIds: workers.map(w => w.id),
      instanceIds: Array.from(existingInstanceIds)
    });

    for (const worker of workers) {
      if (!existingInstanceIds.has(worker.id)) {
        console.log(`🆕 Creating instance for worker: ${worker.name} (${worker.id})`);
        // Создаем card instance для рабочего
        const workerCard: Card = {
          id: worker.id,
          name: worker.name,
          type: 'workers' as any,
          description: worker.description || '',
          image: worker.image || '',
          power: 0,
          defense: 0,
          health: 100,
          magic: 0,
          rarity: 1,
          currentHealth: 100,
          lastHealTime: Date.now()
        };
        await createCardInstance(workerCard, 'hero'); // Use 'hero' as type since CardInstance supports hero/dragon
      }
    }
  }, [gameData.inventory, cardInstances, createCardInstance]);

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

  // Синхронизация при изменении данных - ОТКЛЮЧАЕМ чтобы избежать бесконечного цикла
  // useEffect(() => {
  //   if (gameData.cards && cardInstances) {
  //     syncCardsToInstances();
  //   }
  // }, [gameData.cards?.length, cardInstances?.length]); // Используем только length для сравнения

  // useEffect(() => {
  //   if (gameData.inventory && cardInstances) {
  //     syncWorkersToInstances();
  //   }
  // }, [gameData.inventory?.length, cardInstances?.length]); // Используем только length для сравнения

  useEffect(() => {
    if (gameData.cards && cardInstances?.length) {
      syncHealthFromInstances();
    }
  }, [cardInstances?.length]); // Синхронизируем здоровье только при изменении количества instances

  // Очистка экземпляров, которых больше нет в колоде (например, после апгрейда/сжигания)
  // ОТКЛЮЧАЕМ автоматическую очистку чтобы избежать бесконечного цикла
  // useEffect(() => {
  //   if (!gameData.cards || !cardInstances.length) return;
  //   const cards = gameData.cards as Card[];
  //   const cardIds = new Set(cards.map(c => c.id));
  //   const instanceIds = new Set(cardInstances.map(ci => ci.card_template_id));

  //   // Только если есть реальная разница между наборами
  //   const toRemove = cardInstances.filter(inst => !cardIds.has(inst.card_template_id));
  //   if (toRemove.length > 0) {
  //     console.log('🗑️ Removing obsolete card instances:', toRemove.map(i => i.card_template_id));
  //     toRemove.forEach(inst => deleteCardInstanceByTemplate(inst.card_template_id));
  //   }
  // }, [gameData.cards?.length, cardInstances?.length]); // Проверяем только изменения в количестве

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