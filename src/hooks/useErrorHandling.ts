import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

export const useErrorHandling = () => {
  const { accountId } = useWalletContext();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const calculateDelay = (attempt: number, options: RetryOptions) => {
    const { baseDelay = 1000, maxDelay = 10000, backoffMultiplier = 2 } = options;
    const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelay);
  };

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error;

    for (let attempt = 0; attempt <= opts.maxRetries!; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Определяем, стоит ли повторять попытку
        if (!shouldRetry(error, attempt, opts.maxRetries!)) {
          break;
        }

        // Ждем перед следующей попыткой
        if (attempt < opts.maxRetries!) {
          const delay = calculateDelay(attempt, opts);
          console.log(`Retry attempt ${attempt + 1} in ${delay}ms:`, error);
          await sleep(delay);
        }
      }
    }

    throw lastError!;
  }, []);

  const shouldRetry = (error: any, attempt: number, maxRetries: number): boolean => {
    if (attempt >= maxRetries) return false;

    // Не повторяем для ошибок аутентификации
    if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
      return false;
    }

    // Не повторяем для ошибок валидации данных
    if (error?.code === '23505' || error?.code === '23503') {
      return false;
    }

    // Повторяем для сетевых ошибок и временных проблем
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT', 
      'ENOTFOUND',
      'EAI_AGAIN',
      'PGRST001', // Supabase connection error
      'PGRST500'  // Supabase server error
    ];

    return retryableErrors.some(code => 
      error?.code?.includes(code) || error?.message?.includes(code)
    );
  };

  const withErrorHandling = useCallback(<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    retryOptions?: RetryOptions
  ) => {
    return async (): Promise<T> => {
      try {
        return await retryOperation(operation, retryOptions);
      } catch (error) {
        console.error('Operation failed after retries:', error);
        
        // Логируем ошибку для мониторинга
        await logError(error, 'withErrorHandling');
        
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        
        throw error;
      }
    };
  }, [retryOperation]);

  const logError = useCallback(async (error: any, context: string) => {
    try {
      // Не логируем, если нет подключения к кошельку
      if (!accountId) return;

      await supabase.from('data_changes').insert({
        table_name: 'error_log',
        record_id: crypto.randomUUID(),
        wallet_address: accountId,
        change_type: 'ERROR',
        new_data: {
          error: error?.message || 'Unknown error',
          code: error?.code,
          context,
          timestamp: new Date().toISOString(),
          stack: error?.stack
        }
      });
    } catch (logError) {
      // Игнорируем ошибки логирования
      console.warn('Failed to log error:', logError);
    }
  }, [accountId]);

  const isNetworkError = useCallback((error: any): boolean => {
    return error?.name === 'NetworkError' ||
           error?.message?.includes('fetch') ||
           error?.message?.includes('network') ||
           error?.code === 'NETWORK_ERROR';
  }, []);

  const isOffline = useCallback((): boolean => {
    return !navigator.onLine;
  }, []);

  const handleOfflineOperation = useCallback(<T>(
    operation: () => Promise<T>,
    offlineCallback?: () => T
  ) => {
    return async (): Promise<T> => {
      if (isOffline()) {
        if (offlineCallback) {
          return offlineCallback();
        }
        throw new Error('Operation not available offline');
      }
      
      return await operation();
    };
  }, [isOffline]);

  return {
    retryOperation,
    withErrorHandling,
    logError,
    isNetworkError,
    isOffline,
    handleOfflineOperation
  };
};