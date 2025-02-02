import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Game } from "./pages/Game";
import { Battle } from "./pages/Battle";
import { Grimoire } from "./pages/Grimoire";
import Index from "./pages/Index";
import { DragonEggProvider } from "./contexts/DragonEggContext";
import { AdventuresTab } from "./components/game/adventures/AdventuresTab";
import { MarketplaceTab } from "./components/game/marketplace/MarketplaceTab";
import "./App.css";

export const App = () => {
  return (
    <DragonEggProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/game" element={<Game />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/grimoire" element={<Grimoire />} />
          <Route path="/adventure" element={<AdventuresTab />} />
          <Route path="/marketplace" element={<MarketplaceTab />} />
        </Routes>
      </Router>
    </DragonEggProvider>
  );
};

export default App;