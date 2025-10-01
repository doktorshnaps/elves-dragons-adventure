import { QueryClient } from '@tanstack/react-query';

/**
 * Конфигурация React Query для оптимального кэширования
 * Priority #2: Оптимизация кэширования данных
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

/**
 * Query keys для централизованного управления
 */
export const queryKeys = {
  gameData: (walletAddress: string) => ['gameData', walletAddress] as const,
  cardInstances: (walletAddress: string) => ['cardInstances', walletAddress] as const,
  marketplace: () => ['marketplace'] as const,
  shopInventory: () => ['shopInventory'] as const,
  profile: (walletAddress: string) => ['profile', walletAddress] as const,
  whitelist: (walletAddress: string) => ['whitelist', walletAddress] as const,
  medicalBay: (walletAddress: string) => ['medicalBay', walletAddress] as const,
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
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['medicalBay'] });
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
    queryClient.setQueryData(queryKeys.gameData(walletAddress), (old: any) => {
      if (!old) return old;
      return { ...old, cards: [...(old.cards || []), card] };
    });
  },

  /**
   * Оптимистичное добавление предмета
   */
  addItem: (walletAddress: string, item: any) => {
    queryClient.setQueryData(queryKeys.gameData(walletAddress), (old: any) => {
      if (!old) return old;
      return { ...old, inventory: [...(old.inventory || []), item] };
    });
  },
};
