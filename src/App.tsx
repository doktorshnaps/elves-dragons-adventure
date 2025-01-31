import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Game } from "./pages/Game";
import { Battle } from "./pages/Battle";
import { Grimoire } from "./pages/Grimoire";
import { DragonEggProvider } from "./contexts/DragonEggContext";
import "./App.css";

export const App = () => {
  return (
    <DragonEggProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/grimoire" element={<Grimoire />} />
        </Routes>
      </Router>
    </DragonEggProvider>
  );
};

export default App;