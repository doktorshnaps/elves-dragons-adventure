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
import { BlackDragonLair } from './pages/dungeons/BlackDragonLair';
import { ForgottenSoulsCave } from './pages/dungeons/ForgottenSoulsCave';
import { IcyThrone } from './pages/dungeons/IcyThrone';
import { DarkMageTower } from './pages/dungeons/DarkMageTower';
import { SpiderNest } from './pages/dungeons/SpiderNest';
import { BoneDemonDungeon } from './pages/dungeons/BoneDemonDungeon';
import { SeaSerpentLair } from './pages/dungeons/SeaSerpentLair';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/team" element={<Team />} />
      <Route path="/equipment" element={<Equipment />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/grimoire" element={<Grimoire />} />
      <Route path="/battle" element={<Battle />} />
      <Route path="/dungeons" element={<Dungeons />} />
      <Route path="/adventure" element={<AdventuresPage />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/dungeons/dragon-lair" element={<BlackDragonLair />} />
      <Route path="/dungeons/forgotten-souls" element={<ForgottenSoulsCave />} />
      <Route path="/dungeons/icy-throne" element={<IcyThrone />} />
      <Route path="/dungeons/dark-mage" element={<DarkMageTower />} />
      <Route path="/dungeons/spider-nest" element={<SpiderNest />} />
      <Route path="/dungeons/bone-dungeon" element={<BoneDemonDungeon />} />
      <Route path="/dungeons/sea-serpent" element={<SeaSerpentLair />} />
    </Routes>
  );
}

export default App;