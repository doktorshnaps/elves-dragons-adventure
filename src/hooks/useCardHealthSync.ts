import { useCallback } from 'react';

/**
 * ОТКЛЮЧЕННЫЙ хук для синхронизации здоровья карт
 * Заменен на централизованный менеджер cardInstanceManager
 */
export const useCardHealthSync = () => {
  console.log('useCardHealthSync: Hook is DISABLED, using cardInstanceManager instead');

  // Все функции отключены для совместимости
  const syncHealthFromInstances = useCallback(async () => {
    console.log('syncHealthFromInstances: DISABLED');
    return;
  }, []);

  const loadCardInstances = useCallback(async () => {
    console.log('loadCardInstances: DISABLED');
    return [];
  }, []);

  return {
    syncHealthFromInstances,
    loadCardInstances
  };
};