
import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Equipment } from './pages/Equipment';
import { Team } from './pages/Team';
import { Statistics } from './pages/Statistics';
import { Grimoire } from './pages/Grimoire';
import { Menu } from './pages/Menu';
import Index from './pages/Index';
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

function App() {
  useEffect(() => {
    // Force viewport reset on open
    const setViewport = () => {
      const meta = document.querySelector('meta[name=viewport]');
      meta?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover');
    };

    setViewport();
    window.addEventListener('resize', setViewport);
    
    // Initialize Telegram WebApp
    const initTelegram = () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.enableClosingConfirmation();
      }
    };

    initTelegram();
    
    return () => window.removeEventListener('resize', setViewport);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden fixed inset-0">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/team" element={<Team />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/grimoire" element={<Grimoire />} />
        <Route path="/adventure" element={<AdventuresPage />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/quest" element={<QuestPage />} />
        <Route path="/dungeons/dragon-lair" element={<BlackDragonLair />} />
        <Route path="/dungeons/forgotten-souls" element={<ForgottenSoulsCave />} />
        <Route path="/dungeons/icy-throne" element={<IcyThrone />} />
        <Route path="/dungeons/dark-mage" element={<DarkMageTower />} />
        <Route path="/dungeons/spider-nest" element={<SpiderNest />} />
        <Route path="/dungeons/bone-dungeon" element={<BoneDemonDungeon />} />
        <Route path="/dungeons/sea-serpent" element={<SeaSerpentLair />} />
      </Routes>
    </div>
  );
}

export default App;
