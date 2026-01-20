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
import { CardInstancesProvider } from './providers/CardInstancesProvider';
import { ItemInstancesProvider } from './providers/ItemInstancesProvider';
import { GameEventsProvider } from './contexts/GameEventsContext';
import { ReferralHandler } from './components/ReferralHandler';
import { AppInitializer } from './components/AppInitializer';
import { MetricsPanel } from './components/dev/MetricsPanel';

// Lazy load page components to reduce initial bundle size
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Menu = lazy(() => import('./pages/Menu').then(m => ({ default: m.Menu })));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const SoulArchive = lazy(() => import('./pages/SoulArchive').then(m => ({ default: m.SoulArchive })));
const Seekers = lazy(() => import('./pages/Seekers').then(m => ({ default: m.Seekers })));
const Tutorial = lazy(() => import('./pages/Tutorial').then(m => ({ default: m.Tutorial })));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));
const MusicController = lazy(() => import('./components/MusicController').then(m => ({ default: m.MusicController })));

// Lazy load route-specific components
const EquipmentWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.EquipmentWithLazyLoading })));
const TeamStatsWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.TeamStatsWithLazyLoading })));
const GrimoireWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.GrimoireWithLazyLoading })));
const DungeonsWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.DungeonsWithLazyLoading })));
const AdventuresPageWithLazyLoading = lazy(() => import('./components/lazy/LazyComponents').then(m => ({ default: m.AdventuresPageWithLazyLoading })));
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
const Wibe3TestPanel = lazy(() => import('./components/wibe3/Wibe3TestPanel'));

// Simple loading fallback
const PageLoader = () => <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />;

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <GameEventsProvider>
          <StaticGameDataProvider>
            <AdminProvider>
              <WhitelistProvider>
                <BanStatusProvider>
                  <GameDataProvider>
                    <CardInstancesProvider>
                      <ItemInstancesProvider>
                        <BrightnessProvider>
                          <MusicProvider>
                            <LanguageProvider>
                            <AppInitializer />
                            <div className="overflow-x-hidden max-w-full w-full">
                              <Suspense fallback={<PageLoader />}>
                                <ReferralHandler />
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
                                  <Route path="/tutorial" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><Tutorial /></ProtectedRoute></Suspense>} />
                                  <Route path="/team" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><TeamStatsWithLazyLoading /></ProtectedRoute></Suspense>} />
                                  <Route path="/statistics" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><TeamStatsWithLazyLoading /></ProtectedRoute></Suspense>} />
                                  <Route path="/equipment" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><EquipmentWithLazyLoading /></ProtectedRoute></Suspense>} />
                                  <Route path="/grimoire" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><GrimoireWithLazyLoading /></ProtectedRoute></Suspense>} />
                                  <Route path="/dungeons" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><DungeonsWithLazyLoading /></ProtectedRoute></Suspense>} />
                                  <Route path="/adventure" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><AdventuresPageWithLazyLoading /></ProtectedRoute></Suspense>} />
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
                                  <Route path="/wibe3-test" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><Wibe3TestPanel /></ProtectedRoute></Suspense>} />
                                </Routes>
                              </Suspense>
                              <Toaster />
                              {import.meta.env.DEV && <MetricsPanel />}
                            </div>
                            </LanguageProvider>
                          </MusicProvider>
                        </BrightnessProvider>
                      </ItemInstancesProvider>
                    </CardInstancesProvider>
                  </GameDataProvider>
                </BanStatusProvider>
              </WhitelistProvider>
            </AdminProvider>
          </StaticGameDataProvider>
        </GameEventsProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
