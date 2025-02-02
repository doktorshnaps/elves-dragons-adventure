import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Game } from "./pages/Game";
import { Battle } from "./pages/Battle";
import { Grimoire } from "./pages/Grimoire";
import Index from "./pages/Index";
import { DragonEggProvider } from "./contexts/DragonEggContext";
import { AdventuresTab } from "./components/game/adventures/AdventuresTab";
import { MarketplaceTab } from "./components/game/marketplace/MarketplaceTab";
import "./App.css";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full max-w-[1920px] mx-auto overflow-x-hidden">
      <div className="container mx-auto px-4 py-4 h-full">
        {children}
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <DragonEggProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/game" element={<AppLayout><Game /></AppLayout>} />
          <Route path="/battle" element={<AppLayout><Battle /></AppLayout>} />
          <Route path="/grimoire" element={<AppLayout><Grimoire /></AppLayout>} />
          <Route path="/adventure" element={<AppLayout><AdventuresTab /></AppLayout>} />
          <Route path="/marketplace" element={<AppLayout><MarketplaceTab /></AppLayout>} />
        </Routes>
      </Router>
    </DragonEggProvider>
  );
};

export default App;