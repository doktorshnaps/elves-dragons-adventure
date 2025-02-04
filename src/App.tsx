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
    </Routes>
  );
}

export default App;