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

// Lazy imports
import {
  EquipmentWithLazyLoading,
  TeamStatsWithLazyLoading,
  GrimoireWithLazyLoading,
  BattleWithLazyLoading,
  DungeonsWithLazyLoading,
  AdventuresPageWithLazyLoading,
  MarketplaceWithLazyLoading,
  ShopPageWithLazyLoading,
  QuestPageWithLazyLoading,
  ShelterWithLazyLoading,
  LazyBlackDragonLair,
  LazyForgottenSoulsCave,
  LazyIcyThrone,
  LazyDarkMageTower,
  LazySpiderNest,
  LazyBoneDemonDungeon,
  LazySeaSerpentLair
} from './components/lazy/LazyComponents';

function App() {
  useAccountSync();
  useRoutePreloader(); // Инициализируем preloading
  
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
          <Route path="/grimoire" element={<ProtectedRoute><GrimoireWithLazyLoading /></ProtectedRoute>} />
          <Route path="/battle" element={<ProtectedRoute><BattleWithLazyLoading /></ProtectedRoute>} />
          <Route path="/dungeons" element={<ProtectedRoute><DungeonsWithLazyLoading /></ProtectedRoute>} />
          <Route path="/adventure" element={<ProtectedRoute><AdventuresPageWithLazyLoading /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><MarketplaceWithLazyLoading /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute><ShopPageWithLazyLoading /></ProtectedRoute>} />
          <Route path="/quest" element={<ProtectedRoute><QuestPageWithLazyLoading /></ProtectedRoute>} />
          <Route path="/shelter" element={<ProtectedRoute><ShelterWithLazyLoading /></ProtectedRoute>} />
          <Route path="/dungeons/dragon-lair" element={<ProtectedRoute><LazyBlackDragonLair /></ProtectedRoute>} />
          <Route path="/dungeons/forgotten-souls" element={<ProtectedRoute><LazyForgottenSoulsCave /></ProtectedRoute>} />
          <Route path="/dungeons/icy-throne" element={<ProtectedRoute><LazyIcyThrone /></ProtectedRoute>} />
          <Route path="/dungeons/dark-mage" element={<ProtectedRoute><LazyDarkMageTower /></ProtectedRoute>} />
          <Route path="/dungeons/spider-nest" element={<ProtectedRoute><LazySpiderNest /></ProtectedRoute>} />
          <Route path="/dungeons/bone-dungeon" element={<ProtectedRoute><LazyBoneDemonDungeon /></ProtectedRoute>} />
          <Route path="/dungeons/sea-serpent" element={<ProtectedRoute><LazySeaSerpentLair /></ProtectedRoute>} />
          </Routes>
          <Toaster />
        </LanguageProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;