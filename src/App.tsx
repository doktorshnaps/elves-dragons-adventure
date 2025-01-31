import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Game } from "./pages/Game";
import { Battle } from "./pages/Battle";
import { Grimoire } from "./pages/Grimoire";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/battle" element={<Battle />} />
        <Route path="/grimoire" element={<Grimoire />} />
      </Routes>
    </Router>
  );
}

export default App;