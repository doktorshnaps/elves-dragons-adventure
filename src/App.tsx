import React from 'react'; // Added React import
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { Menu } from './pages/Menu';
import Index from './pages/Index';
import { Auth } from './pages/Auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAccountSync } from './hooks/useAccountSync';
import { useRoutePreloader } from './hooks/useRoutePreloader';
import { LanguageProvider } from './contexts/LanguageContext';
import { QueryProvider } from './providers/QueryProvider';
import { useGameSync } from './hooks/useGameSync';
import { preloadCriticalLibs } from './utils/bundleOptimizations';
import { registerGameServiceWorker } from './utils/cacheStrategy';

// Lazy imports
import {
  EquipmentWithLazyLoading,
  TeamStatsWithLazyLoading,
  GrimoireWithLazyLoading,
  // BattleWithLazyLoading удален - использует устаревшую механику
  DungeonsWithLazyLoading,
  AdventuresPageWithLazyLoading,
  MarketplaceWithLazyLoading,
  ShopPageWithLazyLoading,
  QuestPageWithLazyLoading,
  ShelterWithLazyLoading,
  SpiderNestWithLazyLoading,
  PantheonOfGodsWithLazyLoading,
  BlackDragonLairWithLazyLoading,
  ForgottenSoulsCaveWithLazyLoading,
  IcyThroneWithLazyLoading,
  DarkMageTowerWithLazyLoading,
  BoneDemonDungeonWithLazyLoading,
  SeaSerpentLairWithLazyLoading
} from './components/lazy/LazyComponents';

function App() {
  useAccountSync();
  useGameSync();
  useRoutePreloader(); // Инициализируем preloading
  
  // Performance optimizations on app start
  React.useEffect(() => {
    preloadCriticalLibs();
    registerGameServiceWorker();
  }, []);
  
  return (
    <ErrorBoundary>
      <QueryProvider>
        <LanguageProvider>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamStatsWithLazyLoading /></ProtectedRoute>} />
          <Route path="/statistics" element={<ProtectedRoute><TeamStatsWithLazyLoading /></ProtectedRoute>} />
          <Route path="/equipment" element={<ProtectedRoute><EquipmentWithLazyLoading /></ProtectedRoute>} />
          {/* Battle удален - использует устаревшую механику */}
          <Route path="/grimoire" element={<ProtectedRoute><GrimoireWithLazyLoading /></ProtectedRoute>} />
          <Route path="/dungeons" element={<ProtectedRoute><DungeonsWithLazyLoading /></ProtectedRoute>} />
          <Route path="/adventure" element={<ProtectedRoute><AdventuresPageWithLazyLoading /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><MarketplaceWithLazyLoading /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute><ShopPageWithLazyLoading /></ProtectedRoute>} />
          <Route path="/quest" element={<ProtectedRoute><QuestPageWithLazyLoading /></ProtectedRoute>} />
          <Route path="/shelter" element={<ProtectedRoute><ShelterWithLazyLoading /></ProtectedRoute>} />
          {/* Активные подземелья */}
          <Route path="/dungeons/spider-nest" element={<ProtectedRoute><SpiderNestWithLazyLoading /></ProtectedRoute>} />
          <Route path="/dungeons/pantheon-gods" element={<ProtectedRoute><PantheonOfGodsWithLazyLoading /></ProtectedRoute>} />
<Route path="/dungeons/dragon-lair" element={<ProtectedRoute><BlackDragonLairWithLazyLoading /></ProtectedRoute>} />
<Route path="/dungeons/forgotten-souls" element={<ProtectedRoute><ForgottenSoulsCaveWithLazyLoading /></ProtectedRoute>} />
<Route path="/dungeons/icy-throne" element={<ProtectedRoute><IcyThroneWithLazyLoading /></ProtectedRoute>} />
<Route path="/dungeons/dark-mage" element={<ProtectedRoute><DarkMageTowerWithLazyLoading /></ProtectedRoute>} />
<Route path="/dungeons/bone-dungeon" element={<ProtectedRoute><BoneDemonDungeonWithLazyLoading /></ProtectedRoute>} />
<Route path="/dungeons/sea-serpent" element={<ProtectedRoute><SeaSerpentLairWithLazyLoading /></ProtectedRoute>} />
          </Routes>
          <Toaster />
        </LanguageProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;