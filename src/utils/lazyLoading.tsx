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

// Основная функция для создания lazy компонентов
export function createLazyComponent<T = {}>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  options: LazyLoadOptions = {}
): LazyComponent<T> {
  const {
    fallback = <DefaultLoadingFallback />,
    errorFallback: ErrorFallback = DefaultErrorFallback,
    preload = false,
    delay = 0
  } = options;

  // Создаем lazy компонент с задержкой если нужно
  const LazyComp = lazy(() => {
    if (delay > 0) {
      return new Promise(resolve => {
        setTimeout(() => {
          importFunc().then(resolve);
        }, delay);
      });
    }
    return importFunc();
  }) as LazyComponent<T>;

  // Добавляем метод preload
  LazyComp.preload = importFunc;

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