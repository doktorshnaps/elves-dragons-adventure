import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import { Game } from "./pages/Game";
import { Battle } from "./pages/Battle";
import { Marketplace } from "./pages/Marketplace";
import { Grimoire } from "./pages/Grimoire";
import { Equipment } from "./pages/Equipment";
import { Team } from "./pages/Team";
import { Statistics } from "./pages/Statistics";
import { Menu } from "./pages/Menu";
import Dungeons from "./pages/Dungeons";
import { DragonEggProvider } from "./contexts/DragonEggContext";

function App() {
  return (
    <BrowserRouter>
      <DragonEggProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/game" element={<Game />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/grimoire" element={<Grimoire />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/team" element={<Team />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/dungeons" element={<Dungeons />} />
        </Routes>
        <Toaster />
      </DragonEggProvider>
    </BrowserRouter>
  );
}

export default App;