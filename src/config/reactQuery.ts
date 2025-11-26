import { QueryClient } from '@tanstack/react-query';
import { queryProfiler } from '@/utils/queryProfiler';

/**
 * Конфигурация React Query для оптимального кеширования
 * Priority #2: Оптимизация кеширования данных
 * 
 * НОВОЕ: Интеграция Query Profiler для отслеживания N+1 queries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Кэш на 5 минут
      staleTime: 5 * 60 * 1000,
      // Сохраняем данные 10 минут
      gcTime: 10 * 60 * 1000,
      // Refetch при фокусе окна
      refetchOnWindowFocus: true,
      // Не refetch при reconnect (чтобы не перегружать)
      refetchOnReconnect: false,
      // Ретраи с экспоненциальным backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Ретраи для мутаций
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// ============= Query Profiling Integration =============

// Включаем профилировщик в development режиме
if (import.meta.env.DEV) {
  queryProfiler.setEnabled(true);
  console.log('🔍 Query Profiler enabled in development mode');
  
  // Добавляем команды в window для консоли
  (window as any).queryProfiler = {
    report: () => queryProfiler.printReport(),
    clear: () => queryProfiler.clear(),
    stats: () => queryProfiler.getStats(),
  };
  
  console.log('💡 Use window.queryProfiler.report() to see profiling data');
}

// Патчим queryClient для автоматического профилирования
const originalFetchQuery = queryClient.fetchQuery.bind(queryClient);
queryClient.fetchQuery = async (options: any) => {
  const queryKey = JSON.stringify(options.queryKey);
  const finish = queryProfiler.startQuery(queryKey);
  
  try {
    const result = await originalFetchQuery(options);
    finish();
    return result;
  } catch (error) {
    queryProfiler.errorQuery(queryKey);
    finish();
    throw error;
  }
};

/**
 * Query keys для централизованного управления
 */
export const queryKeys = {
  gameData: (walletAddress: string) => ['gameData', walletAddress] as const,
  cardInstances: (walletAddress: string) => ['cardInstances', walletAddress] as const,
  itemInstances: (walletAddress: string) => ['itemInstances', walletAddress] as const,
  marketplace: () => ['marketplace'] as const,
  shopInventory: () => ['shopInventory'] as const,
  shopDataComplete: (walletAddress: string) => ['shopDataComplete', walletAddress] as const,
  profile: (walletAddress: string) => ['profile', walletAddress] as const,
  whitelist: (walletAddress: string) => ['whitelist', walletAddress] as const,
  medicalBay: (walletAddress: string) => ['medicalBay', walletAddress] as const,
  forgeBay: (walletAddress: string) => ['forgeBay', walletAddress] as const,
  staticGameData: () => ['staticGameData', 'v2'] as const,
} as const;

/**
 * Утилиты для prefetching
 */
export const prefetchUtils = {
  /**
   * Prefetch game data для плавной навигации
   */
  prefetchGameData: (walletAddress: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.gameData(walletAddress),
      staleTime: 5 * 60 * 1000,
    });
  },

  /**
   * Prefetch marketplace listings
   */
  prefetchMarketplace: () => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.marketplace(),
      staleTime: 30 * 1000, // 30 секунд для marketplace
    });
  },

  /**
   * Invalidate all user data при logout
   */
  invalidateAllUserData: () => {
    queryClient.invalidateQueries({ queryKey: ['gameData'] });
    queryClient.invalidateQueries({ queryKey: ['cardInstances'] });
    queryClient.invalidateQueries({ queryKey: ['itemInstances'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['medicalBay'] });
    queryClient.invalidateQueries({ queryKey: ['forgeBay'] });
  },
};

/**
 * Оптимистичные обновления для общих операций
 */
export const optimisticUpdates = {
  /**
   * Оптимистичное обновление баланса
   */
  updateBalance: (walletAddress: string, newBalance: number) => {
    queryClient.setQueryData(queryKeys.gameData(walletAddress), (old: any) => {
      if (!old) return old;
      return { ...old, balance: newBalance };
    });
  },

  /**
   * Оптимистичное добавление карты
   */
  addCard: (walletAddress: string, card: any) => {
    queryClient.setQueryData(queryKeys.cardInstances(walletAddress), (old: any[] = []) => {
      return [...old, card];
    });
  },

  /**
   * Оптимистичное добавление предмета
   */
  addItem: (walletAddress: string, item: any) => {
    queryClient.setQueryData(queryKeys.itemInstances(walletAddress), (old: any[] = []) => {
      return [...old, item];
    });
  },
};
