import { Routes, Route } from 'react-router-dom';
import { Game } from './pages/Game';
import { Team } from './pages/Team';
import { Equipment } from './pages/Equipment';
import { Marketplace } from './pages/Marketplace';
import { Statistics } from './pages/Statistics';
import { Grimoire } from './pages/Grimoire';
import { Battle } from './pages/Battle';
import { Menu } from './pages/Menu';
import Index from './pages/Index';
import Dungeons from './pages/Dungeons';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/game" element={<Game />} />
      <Route path="/team" element={<Team />} />
      <Route path="/equipment" element={<Equipment />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/grimoire" element={<Grimoire />} />
      <Route path="/battle" element={<Battle />} />
      <Route path="/dungeons" element={<Dungeons />} />
    </Routes>
  );
}

export default App;