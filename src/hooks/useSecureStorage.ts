import { useCallback, useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { validateCriticalData, clearCriticalData } from '@/utils/secureStorage';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook для проверки целостности критических данных в localStorage
 * 
 * Автоматически проверяет данные при подключении кошелька и
 * периодически в фоновом режиме
 */
export const useSecureStorage = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();

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
        
        // Перезагружаем данные из Supabase
        window.dispatchEvent(new CustomEvent('reload-game-data'));
      }
    } catch (e) {
      console.error('Failed to validate storage:', e);
    }
  }, [accountId, toast]);

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
