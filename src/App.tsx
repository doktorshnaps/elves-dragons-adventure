import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Game from "./pages/Game";
import Index from "./pages/Index";
import Battle from "./pages/Battle";
import { DragonEggProvider } from "./contexts/DragonEggContext";

function App() {
  return (
    <DragonEggProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/game" element={<Game />} />
          <Route path="/battle" element={<Battle />} />
        </Routes>
        <Toaster />
      </Router>
    </DragonEggProvider>
  );
}

export default App;