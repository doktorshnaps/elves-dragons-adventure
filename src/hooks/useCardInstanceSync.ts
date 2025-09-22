import { useEffect, useCallback } from 'react';
import { useCardInstances } from './useCardInstances';
import { useGameData } from './useGameData';
import { Card } from '@/types/cards';

const HEAL_INTERVAL = 60 * 1000; // 1 минута
const HEAL_RATE = 1; // 1 HP за минуту

export const useCardInstanceSync = () => {
  const { cardInstances, updateCardHealth, createCardInstance, deleteCardInstanceByTemplate } = useCardInstances();
  const { gameData, updateGameData } = useGameData();

  // ОТКЛЮЧЕНО создание экземпляров из gameData.cards - card_instances теперь источник истины
  // Больше не создаем экземпляры из gameData.cards, так как это может создавать дубликаты

  // Синхронизация всех карт из card_instances обратно в gameData
  const syncAllCardsFromInstances = useCallback(async () => {
    if (!cardInstances.length) return;

    console.log('🔄 Rebuilding cards from card_instances:', {
      instancesCount: cardInstances.length,
      currentCardsCount: gameData.cards?.length || 0
    });

    // Создаем полную коллекцию карт из всех экземпляров 
    const cardsFromInstances = cardInstances
      .filter(instance => instance.card_type !== 'workers') // Исключаем рабочих
      .map(instance => {
        const cardData = instance.card_data as Card;
        return {
          ...cardData,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false
        } as Card;
      });

    console.log('🔄 Cards rebuilt from instances:', {
      totalCards: cardsFromInstances.length,
      heroes: cardsFromInstances.filter(c => c.type === 'character').length,
      dragons: cardsFromInstances.filter(c => c.type === 'pet').length
    });

    // Обновляем gameData только если есть различия
    const currentCards = gameData.cards || [];
    const hasChanges = cardsFromInstances.length !== currentCards.length ||
      cardsFromInstances.some(newCard => {
        const existing = currentCards.find((c: any) => c.id === newCard.id);
        return !existing || 
          existing.currentHealth !== newCard.currentHealth ||
          existing.lastHealTime !== newCard.lastHealTime;
      });

    if (hasChanges) {
      console.log('✅ Updating gameData with all cards from instances');
      await updateGameData({ cards: cardsFromInstances });
      
      // Persist for legacy components and local sessions
      localStorage.setItem('gameCards', JSON.stringify(cardsFromInstances));
      
      // Dispatch global events for immediate UI sync
      window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: cardsFromInstances } }));
      window.dispatchEvent(new CustomEvent('cardsHealthUpdate', { detail: { cards: cardsFromInstances } }));
    }
  }, [cardInstances, gameData.cards, updateGameData]);

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

  // ОТКЛЮЧЕНО создание экземпляров из gameData - источник истины теперь card_instances

  useEffect(() => {
    syncAllCardsFromInstances();
  }, [syncAllCardsFromInstances]);

  // ОТКЛЮЧЕНА очистка экземпляров - card_instances теперь источник истины
  // useEffect для очистки ОТКЛЮЧЕН, чтобы не удалять корректные карты
  // Теперь card_instances является источником истины для коллекции карт

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
      syncAllCardsFromInstances();
    };

    window.addEventListener('cardInstanceHealthUpdate', handleHealthUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cardInstanceHealthUpdate', handleHealthUpdate as EventListener);
    };
  }, [syncAllCardsFromInstances]);

  return {
    applyDamageToCard,
    processHealthRegeneration
  };
};