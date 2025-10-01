import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useCardInstances } from './useCardInstances';
import { useGameData } from './useGameData';
import { Card, CardType } from '@/types/cards';
import debounce from 'lodash.debounce';

const HEAL_INTERVAL = 60 * 1000; // 1 минута
const HEAL_RATE = 1; // 1 HP за минуту

export const useCardInstanceSync = () => {
  const { cardInstances, updateCardHealth, createCardInstance, deleteCardInstanceByTemplate } = useCardInstances();
  const { gameData, updateGameData } = useGameData();

  // Защита от множественных одновременных синхронизаций
  const isSyncingRef = useRef(false);
  const lastSyncedDataRef = useRef<string>('');

  // ОТКЛЮЧЕНО создание экземпляров из gameData.cards - card_instances теперь источник истины
  // Больше не создаем экземпляры из gameData.cards, так как это может создавать дубликаты

  // Синхронизация всех карт из card_instances обратно в gameData
  const syncAllCardsFromInstancesInternal = useCallback(async () => {
    // Проверка: если уже идет синхронизация, пропускаем
    if (isSyncingRef.current) {
      console.log('⏭️ Sync already in progress, skipping...');
      return;
    }

    if (!cardInstances.length) {
      console.log('⏭️ No card instances to sync');
      return;
    }

    // Устанавливаем флаг синхронизации
    isSyncingRef.current = true;

    try {
      console.log('🔄 Rebuilding cards from card_instances:', {
        instancesCount: cardInstances.length,
        currentCardsCount: gameData.cards?.length || 0
      });

      // Создаем полную коллекцию карт из всех экземпляров 
      const cardsFromInstances = cardInstances
        .filter(instance => {
          // Исключаем только рабочих, но показываем все остальные карты (включая heroes и dragons)
          const cardType = instance.card_type;
          const dataType = (instance.card_data as any)?.type as CardType;
          
          // Исключаем workers/рабочих (card_type в БД может быть 'worker' или 'workers')
          const isWorker = cardType === 'workers' || (cardType as string) === 'worker' || 
                          dataType === 'workers';
          
          return !isWorker;
        })
        .map(instance => {
          const cardData = instance.card_data as Card;
          return {
            ...cardData,
            currentHealth: instance.current_health,
            lastHealTime: new Date(instance.last_heal_time).getTime(),
            isInMedicalBay: instance.is_in_medical_bay || false
          } as Card;
        });

      // Создаем хеш для сравнения (более эффективно чем JSON.stringify всего массива)
      const createCardsHash = (cards: Card[]) => {
        return cards
          .map(c => `${c.id}:${c.currentHealth}:${c.lastHealTime}`)
          .sort()
          .join('|');
      };

      const newHash = createCardsHash(cardsFromInstances);
      
      // Проверяем, изменились ли данные с последней синхронизации
      if (lastSyncedDataRef.current === newHash) {
        console.log('⏭️ No changes detected since last sync, skipping...');
        return;
      }

      console.log('🔄 Cards rebuilt from instances:', {
        totalCards: cardsFromInstances.length,
        heroes: cardsFromInstances.filter(c => c.type === 'character').length,
        dragons: cardsFromInstances.filter(c => c.type === 'pet').length,
        totalInstances: cardInstances.length,
        excludedWorkers: cardInstances.filter(instance => {
          const cardType = instance.card_type;
          const dataType = (instance.card_data as any)?.type as CardType;
          return cardType === 'workers' || (cardType as string) === 'worker' || 
                 dataType === 'workers';
        }).length
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
        
        // Сохраняем хеш последней успешной синхронизации
        lastSyncedDataRef.current = newHash;
        
        // Persist for legacy components and local sessions
        localStorage.setItem('gameCards', JSON.stringify(cardsFromInstances));
        
        // Dispatch global events for immediate UI sync
        window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: cardsFromInstances } }));
        window.dispatchEvent(new CustomEvent('cardsHealthUpdate', { detail: { cards: cardsFromInstances } }));
      } else {
        console.log('⏭️ No changes to sync');
      }
    } catch (error) {
      console.error('❌ Error in syncAllCardsFromInstances:', error);
    } finally {
      // Всегда снимаем флаг синхронизации
      isSyncingRef.current = false;
    }
  }, [cardInstances, gameData.cards, updateGameData]);

  // Debounced версия синхронизации для предотвращения частых вызовов
  const syncAllCardsFromInstances = useMemo(
    () => debounce(syncAllCardsFromInstancesInternal, 500, {
      leading: true,  // Вызвать сразу при первом вызове
      trailing: true, // И через 500ms после последнего вызова
      maxWait: 2000   // Но не дольше 2 секунд
    }),
    [syncAllCardsFromInstancesInternal]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      syncAllCardsFromInstances.cancel();
    };
  }, [syncAllCardsFromInstances]);

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