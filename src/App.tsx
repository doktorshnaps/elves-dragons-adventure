import { Routes, Route } from 'react-router-dom';
import { Equipment } from './pages/Equipment';
import { Team } from './pages/Team';
import { Statistics } from './pages/Statistics';
import { Grimoire } from './pages/Grimoire';
import { Battle } from './pages/Battle';
import { Menu } from './pages/Menu';
import Index from './pages/Index';
import Dungeons from './pages/Dungeons';
import { AdventuresPage } from './pages/AdventuresPage';
import { Marketplace } from './pages/Marketplace';
import { ShopPage } from './pages/ShopPage';
import { QuestPage } from './pages/QuestPage';
import { BlackDragonLair } from './pages/dungeons/BlackDragonLair';
import { ForgottenSoulsCave } from './pages/dungeons/ForgottenSoulsCave';
import { IcyThrone } from './pages/dungeons/IcyThrone';
import { DarkMageTower } from './pages/dungeons/DarkMageTower';
import { SpiderNest } from './pages/dungeons/SpiderNest';
import { BoneDemonDungeon } from './pages/dungeons/BoneDemonDungeon';
import { SeaSerpentLair } from './pages/dungeons/SeaSerpentLair';
import { Auth } from './pages/Auth';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
      <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
      <Route path="/grimoire" element={<ProtectedRoute><Grimoire /></ProtectedRoute>} />
      <Route path="/battle" element={<ProtectedRoute><Battle /></ProtectedRoute>} />
      <Route path="/dungeons" element={<ProtectedRoute><Dungeons /></ProtectedRoute>} />
      <Route path="/adventure" element={<ProtectedRoute><AdventuresPage /></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
      <Route path="/quest" element={<ProtectedRoute><QuestPage /></ProtectedRoute>} />
      <Route path="/dungeons/dragon-lair" element={<ProtectedRoute><BlackDragonLair /></ProtectedRoute>} />
      <Route path="/dungeons/forgotten-souls" element={<ProtectedRoute><ForgottenSoulsCave /></ProtectedRoute>} />
      <Route path="/dungeons/icy-throne" element={<ProtectedRoute><IcyThrone /></ProtectedRoute>} />
      <Route path="/dungeons/dark-mage" element={<ProtectedRoute><DarkMageTower /></ProtectedRoute>} />
      <Route path="/dungeons/spider-nest" element={<ProtectedRoute><SpiderNest /></ProtectedRoute>} />
      <Route path="/dungeons/bone-dungeon" element={<ProtectedRoute><BoneDemonDungeon /></ProtectedRoute>} />
      <Route path="/dungeons/sea-serpent" element={<ProtectedRoute><SeaSerpentLair /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;