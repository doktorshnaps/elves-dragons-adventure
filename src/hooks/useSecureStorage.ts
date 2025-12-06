import { useCallback, useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { validateCriticalData, clearCriticalData } from '@/utils/secureStorage';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook для проверки целостности критических данных в localStorage
 * 
 * Автоматически проверяет данные при подключении кошелька и
 * периодически в фоновом режиме
 */
export const useSecureStorage = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateAndClean = useCallback(async () => {
    if (!accountId) return;

    try {
      const result = await validateCriticalData(accountId);
      
      if (!result.valid) {
        console.warn('⚠️ SECURITY: Invalid localStorage data detected:', result.invalidKeys);
        
        // Очищаем поврежденные данные
        clearCriticalData();
        
        // Показываем предупреждение пользователю только в dev режиме
        if (import.meta.env.DEV) {
          toast({
            title: "Обнаружены поврежденные данные",
            description: "Локальные данные были очищены. Загружаем из сервера...",
            variant: "default"
          });
        }
        
        // Invalidate all game data caches to reload from server
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['gameData'] }),
          queryClient.invalidateQueries({ queryKey: ['cardInstances'] }),
          queryClient.invalidateQueries({ queryKey: ['itemInstances'] })
        ]);
      }
    } catch (e) {
      console.error('Failed to validate storage:', e);
    }
  }, [accountId, toast, queryClient]);

  // Проверка при подключении кошелька
  useEffect(() => {
    if (accountId) {
      validateAndClean();
    }
  }, [accountId, validateAndClean]);

  // Периодическая проверка каждые 5 минут
  useEffect(() => {
    if (!accountId) return;

    const interval = setInterval(() => {
      validateAndClean();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [accountId, validateAndClean]);

  return { validateAndClean };
};
