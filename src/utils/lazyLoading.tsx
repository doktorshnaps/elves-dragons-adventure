import React, { Suspense, lazy, ComponentType } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  delay?: number;
}

interface LazyComponent<T = {}> extends React.LazyExoticComponent<ComponentType<T>> {
  preload: () => Promise<{ default: ComponentType<T> }>;
}

// Дефолтный loading компонент
const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Дефолтный error компонент
const DefaultErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
    <p className="text-muted-foreground text-sm mb-4 text-center max-w-sm">
      Не удалось загрузить компонент. Проверьте соединение и попробуйте снова.
    </p>
    <button 
      onClick={retry}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
    >
      Повторить
    </button>
  </div>
);

/**
 * Wraps a dynamic import() with retry logic for transient network failures.
 * Critical for iOS WKWebView (Safari + Telegram WebApp) where chunks frequently
 * fail to fetch on slow/flaky connections, causing the entire screen to crash.
 *
 * Strategy: 3 retries with backoff (300ms, 800ms, 1500ms). After exhaustion,
 * triggers a one-time soft reload guarded by sessionStorage to avoid loops.
 */
function importWithRetry<T>(
  importFunc: () => Promise<T>,
  retriesLeft = 3,
  delays = [300, 800, 1500]
): Promise<T> {
  return importFunc().catch((error: any) => {
    const message = String(error?.message || error || '');
    const isChunkError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('error loading dynamically imported module') ||
      message.includes('ChunkLoadError');

    if (!isChunkError || retriesLeft <= 0) {
      // Final fallback: do a soft reload once per session to recover from
      // stale build hashes / killed WKWebView state.
      if (isChunkError && typeof window !== 'undefined') {
        const flag = 'lazyChunkReloadAttempted';
        try {
          if (!sessionStorage.getItem(flag)) {
            sessionStorage.setItem(flag, '1');
            console.warn('🔄 [lazyLoading] Chunk load failed, performing soft reload');
            window.location.reload();
            // Return a never-resolving promise so the error doesn't propagate
            return new Promise<T>(() => {});
          }
        } catch {
          // sessionStorage may be unavailable (privacy mode) — just rethrow
        }
      }
      throw error;
    }

    const delay = delays[delays.length - retriesLeft] ?? 1500;
    console.warn(
      `⚠️ [lazyLoading] Chunk load failed, retrying in ${delay}ms (${retriesLeft} left):`,
      message
    );
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        importWithRetry(importFunc, retriesLeft - 1, delays).then(resolve, reject);
      }, delay);
    });
  });
}

// Основная функция для создания lazy компонентов
export function createLazyComponent<T = {}>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  options: LazyLoadOptions = {}
): LazyComponent<T> {
  const {
    preload = false,
    delay = 0,
  } = options;

  const wrappedImport = () => importWithRetry(importFunc);

  // Создаем lazy компонент с задержкой если нужно
  const LazyComp = lazy(() => {
    if (delay > 0) {
      return new Promise<{ default: ComponentType<T> }>((resolve) => {
        setTimeout(() => {
          wrappedImport().then(resolve);
        }, delay);
      });
    }
    return wrappedImport();
  }) as LazyComponent<T>;

  // Добавляем метод preload (тоже с retry)
  LazyComp.preload = wrappedImport;

  // Если preload = true, начинаем загрузку сразу
  if (preload) {
    LazyComp.preload();
  }

  return LazyComp;
}

// HOC для обертки lazy компонентов с обработкой ошибок
export function withLazyLoading<T = {}>(
  LazyComponent: LazyComponent<T>,
  options: LazyLoadOptions = {}
) {
  const {
    fallback = <DefaultLoadingFallback />,
    errorFallback: ErrorFallback = DefaultErrorFallback
  } = options;

  return React.forwardRef<any, T>((props, ref) => {
    const [retryKey, setRetryKey] = React.useState(0);

    const retry = React.useCallback(() => {
      // Clear chunk-reload guard so the next load can attempt a fresh fetch
      try {
        sessionStorage.removeItem('lazyChunkReloadAttempted');
      } catch {}
      setRetryKey(prev => prev + 1);
    }, []);

    return (
      <ErrorBoundary
        fallback={<ErrorFallback error={new Error('Component failed to load')} retry={retry} />}
        key={retryKey}
      >
        <Suspense fallback={fallback}>
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </ErrorBoundary>
    );
  });
}

// Хук для preloading компонентов
export function usePreloader() {
  const preloadComponent = React.useCallback((lazyComponent: LazyComponent) => {
    if ('preload' in lazyComponent) {
      lazyComponent.preload();
    }
  }, []);

  const preloadMultiple = React.useCallback((lazyComponents: LazyComponent[]) => {
    lazyComponents.forEach(comp => {
      if ('preload' in comp) {
        comp.preload();
      }
    });
  }, []);

  return { preloadComponent, preloadMultiple };
}

// Хук для intersection observer загрузки
export function useLazyIntersection(
  lazyComponent: LazyComponent,
  options: IntersectionObserverInit = {}
) {
  const [shouldLoad, setShouldLoad] = React.useState(false);
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isPreloaded) {
          lazyComponent.preload().then(() => {
            setIsPreloaded(true);
            setShouldLoad(true);
          });
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [lazyComponent, isPreloaded, options]);

  return { ref, shouldLoad };
}
