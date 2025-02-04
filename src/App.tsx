import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Game } from "./pages/Game";
import { Battle } from "./pages/Battle";
import { Grimoire } from "./pages/Grimoire";
import Index from "./pages/Index";
import { DragonEggProvider } from "./contexts/DragonEggContext";
import { AdventuresTab } from "./components/game/adventures/AdventuresTab";
import { Shop } from "./components/Shop";
import { Menu } from "./pages/Menu";
import { Statistics } from "./pages/Statistics";
import { Equipment } from "./pages/Equipment";
import { Team } from "./pages/Team";
import { Marketplace } from "./pages/Marketplace";
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
          <Route 
            path="/" 
            element={
              <AppLayout>
                <Index />
              </AppLayout>
            } 
          />
          <Route 
            path="/menu" 
            element={
              <AppLayout>
                <Menu />
              </AppLayout>
            } 
          />
          <Route 
            path="/battle" 
            element={
              <AppLayout>
                <Battle />
              </AppLayout>
            } 
          />
          <Route 
            path="/grimoire" 
            element={
              <AppLayout>
                <Grimoire />
              </AppLayout>
            } 
          />
          <Route 
            path="/adventure" 
            element={
              <AppLayout>
                <AdventuresTab />
              </AppLayout>
            } 
          />
          <Route 
            path="/magicmarketplace" 
            element={
              <AppLayout>
                <Shop onClose={() => {}} balance={0} onBalanceChange={() => {}} />
              </AppLayout>
            } 
          />
          <Route 
            path="/marketplace" 
            element={
              <AppLayout>
                <Marketplace />
              </AppLayout>
            } 
          />
          <Route 
            path="/statistics" 
            element={
              <AppLayout>
                <Statistics />
              </AppLayout>
            } 
          />
          <Route 
            path="/equipment" 
            element={
              <AppLayout>
                <Equipment />
              </AppLayout>
            } 
          />
          <Route 
            path="/team" 
            element={
              <AppLayout>
                <Team />
              </AppLayout>
            } 
          />
        </Routes>
      </Router>
    </DragonEggProvider>
  );
};

export default App;