import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Game } from "./pages/Game";
import { Battle } from "./pages/Battle";
import { Grimoire } from "./pages/Grimoire";
import Index from "./pages/Index";
import { DragonEggProvider } from "./contexts/DragonEggContext";
import { AdventuresTab } from "./components/game/adventures/AdventuresTab";
import { Shop } from "./components/Shop";
import "./App.css";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full mx-auto overflow-x-hidden bg-game-background">
      <div className="w-full h-full">
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
          <Route path="/marketplace" element={<AppLayout><Shop onClose={() => {}} balance={0} onBalanceChange={() => {}} /></AppLayout>} />
        </Routes>
      </Router>
    </DragonEggProvider>
  );
};

export default App;