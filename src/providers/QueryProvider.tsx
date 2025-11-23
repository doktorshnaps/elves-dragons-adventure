import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useEffect } from 'react';
import { metricsMonitor } from '@/utils/metricsMonitor';
import { setGlobalQueryClient } from '@/utils/staticDataCache';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 минут - дольше кэшируем
      gcTime: 30 * 60 * 1000, // 30 минут
      retry: 2, // Меньше ретраев = быстрее
      retryDelay: 1000, // Фиксированная задержка
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false, // Не рефетчить при каждом маунте
      // Dedupe requests - объединяет одинаковые запросы
      networkMode: 'online'
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
    }
  }
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  useEffect(() => {
    // Устанавливаем глобальный QueryClient для синхронного доступа
    setGlobalQueryClient(queryClient);
    
    // Отслеживаем реальные fetch операции (cache miss) и использование кэша (cache hit)
    const fetchingQueries = new Set<string>();
    
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!event?.query) return;
      
      const query = event.query;
      const queryKey = JSON.stringify(query.queryKey);
      const fetchStatus = query.state.fetchStatus;
      
      // Cache MISS: начался новый fetch
      if (event.type === 'updated' && fetchStatus === 'fetching' && !fetchingQueries.has(queryKey)) {
        fetchingQueries.add(queryKey);
        metricsMonitor.trackCacheMiss();
        console.log('📊 Cache MISS:', query.queryKey);
      }
      
      // Cache HIT: observer получил данные без fetch
      if (event.type === 'observerAdded') {
        const hasData = query.state.data !== undefined;
        const notFetching = fetchStatus !== 'fetching';
        
        if (hasData && notFetching) {
          metricsMonitor.trackCacheHit();
          console.log('📊 Cache HIT:', query.queryKey);
        }
      }
      
      // Очищаем tracking когда fetch завершён
      if (fetchStatus === 'idle' && fetchingQueries.has(queryKey)) {
        fetchingQueries.delete(queryKey);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};