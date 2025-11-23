import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { LanguageProvider } from './contexts/LanguageContext';
import { BrightnessProvider } from './contexts/BrightnessContext';
import { MusicProvider } from './contexts/MusicContext';
import { QueryProvider } from './providers/QueryProvider';
import { AdminProvider } from './contexts/AdminContext';
import { WhitelistProvider } from './contexts/WhitelistContext';
import { BanStatusProvider } from './contexts/BanStatusContext';
import { GameDataProvider } from './contexts/GameDataContext';
import { StaticGameDataProvider } from './contexts/StaticGameDataContext';
import { useRoutePreloader } from './hooks/useRoutePreloader';
import { useNFTStatsRecalculation } from './hooks/useNFTStatsRecalculation';
import { useSecureStorage } from './hooks/useSecureStorage';
import { useAccountSync } from './hooks/useAccountSync';
import { useGameSync } from './hooks/useGameSync';
import { MetricsPanel } from './components/dev/MetricsPanel';

// Lazy load page components to reduce initial bundle size
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Menu = lazy(() => import('./pages/Menu').then(m => ({ default: m.Menu })));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const SoulArchive = lazy(() => import('./pages/SoulArchive').then(m => ({ default: m.SoulArchive })));
const Seekers = lazy(() => import('./pages/Seekers').then(m => ({ default: m.Seekers })));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));
const MusicController = lazy(() => import('./components/MusicController').then(m => ({ default: m.MusicController })));

// Lazy load route-specific components
const EquipmentWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.EquipmentWithLazyLoading })));
const TeamStatsWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.TeamStatsWithLazyLoading })));
const GrimoireWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.GrimoireWithLazyLoading })));
const DungeonsWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.DungeonsWithLazyLoading })));
const AdventuresPageWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.AdventuresPageWithLazyLoading })));
const MarketplaceWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.MarketplaceWithLazyLoading })));
const ShopPageWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.ShopPageWithLazyLoading })));
const QuestPageWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.QuestPageWithLazyLoading })));
const ShelterWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.ShelterWithLazyLoading })));
const SpiderNestWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.SpiderNestWithLazyLoading })));
const PantheonOfGodsWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.PantheonOfGodsWithLazyLoading })));
const BlackDragonLairWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.BlackDragonLairWithLazyLoading })));
const ForgottenSoulsCaveWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.ForgottenSoulsCaveWithLazyLoading })));
const IcyThroneWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.IcyThroneWithLazyLoading })));
const DarkMageTowerWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.DarkMageTowerWithLazyLoading })));
const BoneDemonDungeonWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.BoneDemonDungeonWithLazyLoading })));
const SeaSerpentLairWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.SeaSerpentLairWithLazyLoading })));

// Simple loading fallback
const PageLoader = () => <div style={{ minHeight: '100vh' }} />;

function App() {
  // Запускаем только легковесные хуки на уровне App
  try {
    useRoutePreloader();
    useNFTStatsRecalculation();
    useSecureStorage();
    useAccountSync(); // Один раз на уровне App
    useGameSync(); // Один раз на уровне App
  } catch (error) {
    console.error('❌ Error in App hooks:', error);
  }
  
  // Performance optimizations on app start
  React.useEffect(() => {
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
      // Register service worker and preload libs in idle time
      scheduleIdleTask(() => {
        // Temporarily disable Service Worker on production to avoid stale vendor bundles
        // import('./utils/cacheStrategy').then(({ registerGameServiceWorker }) => {
        //   registerGameServiceWorker().catch(error => {
        //     console.error('❌ Error registering service worker:', error);
        //   });
        // });
        
        import('./utils/bundleOptimizations').then(({ preloadCriticalLibs }) => {
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
  
  return (
    <ErrorBoundary>
      <QueryProvider>
        <StaticGameDataProvider>
          <AdminProvider>
            <WhitelistProvider>
              <BanStatusProvider>
                <GameDataProvider>
                <BrightnessProvider>
            <MusicProvider>
              <LanguageProvider>
                <div className="overflow-x-hidden max-w-full w-full">
                  <Suspense fallback={<PageLoader />}>
                    <MusicController />
                    <Routes>
                    <Route path="/" element={
                      localStorage.getItem('walletConnected') === 'true' 
                        ? <Navigate to="/menu" replace /> 
                        : <Navigate to="/auth" replace />
                    } />
                    <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
                    <Route path="/menu" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><Menu /></ProtectedRoute></Suspense>} />
                    <Route path="/admin-settings" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><AdminSettings /></ProtectedRoute></Suspense>} />
                    <Route path="/soul-archive" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><SoulArchive /></ProtectedRoute></Suspense>} />
                    <Route path="/seekers" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><Seekers /></ProtectedRoute></Suspense>} />
                    <Route path="/team" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><TeamStatsWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/statistics" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><TeamStatsWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/equipment" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><EquipmentWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/grimoire" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><GrimoireWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><DungeonsWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/adventure" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><AdventuresPageWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/marketplace" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><MarketplaceWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/shop" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><ShopPageWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/quest" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><QuestPageWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/shelter" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><ShelterWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/spider-nest" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><SpiderNestWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/pantheon-gods" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><PantheonOfGodsWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/dragon-lair" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><BlackDragonLairWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/forgotten-souls" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><ForgottenSoulsCaveWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/ice-throne" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><IcyThroneWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/icy-throne" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><IcyThroneWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/dark-mage" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><DarkMageTowerWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/bone-dungeon" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><BoneDemonDungeonWithLazyLoading /></ProtectedRoute></Suspense>} />
                    <Route path="/dungeons/sea-serpent" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><SeaSerpentLairWithLazyLoading /></ProtectedRoute></Suspense>} />
                  </Routes>
                </Suspense>
                <Toaster />
                {import.meta.env.DEV && <MetricsPanel />}
              </div>
            </LanguageProvider>
          </MusicProvider>
        </BrightnessProvider>
                </GameDataProvider>
              </BanStatusProvider>
            </WhitelistProvider>
          </AdminProvider>
        </StaticGameDataProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
