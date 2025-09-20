import { useCallback } from 'react';

const HEAL_INTERVAL = 60 * 1000; // 1 минута
const HEAL_RATE = 1; // 1 HP за минуту

/**
 * ОТКЛЮЧЕННЫЙ хук для синхронизации экземпляров карт
 * Заменен на централизованный менеджер cardInstanceManager
 */
export const useCardInstanceSync = () => {
  console.log('useCardInstanceSync: Hook is DISABLED, using cardInstanceManager instead');

  // Все функции отключены для совместимости
  const syncCardsToInstances = useCallback(async () => {
    console.log('syncCardsToInstances: DISABLED');
    return;
  }, []);

  const syncWorkersToInstances = useCallback(async () => {
    console.log('syncWorkersToInstances: DISABLED');
    return;
  }, []);

  const syncHealthFromInstances = useCallback(async () => {
    console.log('syncHealthFromInstances: DISABLED');
    return;
  }, []);

  const processHealthRegeneration = useCallback(async () => {
    console.log('processHealthRegeneration: DISABLED');
    return;
  }, []);

  const applyDamageToCard = useCallback(async (cardId: string, damage: number) => {
    console.log('applyDamageToCard: DISABLED', { cardId, damage });
    return false;
  }, []);

  return {
    applyDamageToCard,
    processHealthRegeneration
  };
};