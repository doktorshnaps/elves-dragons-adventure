import { useEffect, useCallback } from 'react';
import { cardInstanceManager } from '@/utils/cardInstanceManager';
import { batchUpdateManager } from '@/utils/batchUpdates';
import { useWallet } from '@/hooks/useWallet';

/**
 * Хук для глобальных оптимизаций производительности
 */
export const usePerformanceOptimizations = () => {
  console.log('usePerformanceOptimizations: DISABLED to prevent card_instance spam');
  
  // ОТКЛЮЧЕНО - этот хук вызывал постоянные flushAll() операции
  // которые приводили к обработке пакетных операций и созданию/удалению card_instances
  
  // const { accountId } = useWallet();

  // // Принудительная обработка пакетных операций при изменении фокуса страницы
  // useEffect(() => {
  //   const handleVisibilityChange = async () => {
  //     if (document.visibilityState === 'visible') {
  //       console.log('Page became visible, flushing pending operations');
  //       await cardInstanceManager.flushAll();
  //       await batchUpdateManager.flushUpdates();
  //     }
  //   };
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // }, []);

  // // Принудительная обработка при изменении кошелька
  // useEffect(() => {
  //   if (accountId) {
  //     const timer = setTimeout(async () => {
  //       console.log('Processing pending operations for wallet:', accountId);
  //       await cardInstanceManager.flushAll();
  //       await batchUpdateManager.flushUpdates();
  //     }, 2000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [accountId]);

  // // Очистка при размонтировании компонента
  // useEffect(() => {
  //   return () => {
  //     console.log('Cleaning up performance optimizations');
  //     cardInstanceManager.flushAll();
  //     batchUpdateManager.flushUpdates();
  //   };
  // }, []);

  // Ручная функция для принудительной обработки (оставлена для использования при необходимости)
  const flushAllPending = useCallback(async () => {
    console.log('Manual flush disabled to prevent card_instance spam');
    // await Promise.all([
    //   cardInstanceManager.flushAll(),
    //   batchUpdateManager.flushUpdates()
    // ]);
  }, []);

  return { flushAllPending };
};