import { useEffect } from 'react';
import { useRoutePreloader } from '@/hooks/useRoutePreloader';
import { useNFTStatsRecalculation } from '@/hooks/useNFTStatsRecalculation';
import { useSecureStorage } from '@/hooks/useSecureStorage';
import { useAccountSync } from '@/hooks/useAccountSync';
import { useGameSync } from '@/hooks/useGameSync';
import { preloadCardImagesCache } from '@/hooks/useCardImage';

/**
 * AppInitializer - компонент для инициализации хуков внутри провайдеров
 * КРИТИЧНО: Должен быть внутри всех провайдеров (особенно GameDataProvider)
 */
export const AppInitializer = () => {
  // Запускаем хуки, которые требуют доступ к контекстам
  try {
    useRoutePreloader();
    useNFTStatsRecalculation();
    useSecureStorage();
    useAccountSync(); // Требует GameDataProvider
    useGameSync(); // Требует GameDataProvider
  } catch (error) {
    console.error('❌ Error in AppInitializer hooks:', error);
  }

  // Performance optimizations on app start
  useEffect(() => {
    // Add preconnect hints to reduce network latency
    const addPreconnectLink = (href: string, crossorigin?: boolean) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      if (crossorigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    // Preconnect to critical origins
    addPreconnectLink('https://oimhwdymghkwxznjarkv.supabase.co');
    addPreconnectLink('https://fonts.googleapis.com');
    addPreconnectLink('https://fonts.gstatic.com', true);

    // Defer non-critical operations to idle time to improve First Input Delay
    const scheduleIdleTask = (task: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(task, { timeout: 2000 });
      } else {
        setTimeout(task, 1);
      }
    };

    try {
      // ✅ Запускаем предзагрузку card_images (idle time)
      scheduleIdleTask(() => {
        preloadCardImagesCache();
      });

      // Register service worker and preload libs in idle time
      scheduleIdleTask(() => {
        import('../utils/bundleOptimizations').then(({ preloadCriticalLibs }) => {
          try {
            preloadCriticalLibs();
          } catch (error) {
            console.error('❌ Error preloading libs:', error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error in app initialization:', error);
    }
  }, []);

  return null; // Этот компонент не рендерит UI
};
