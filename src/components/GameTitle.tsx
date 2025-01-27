import { useNavigate } from "react-router-dom";

export const GameTitle = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center cursor-pointer group fade-enter fade-enter-active">
      <h1 
        className="text-7xl md:text-9xl font-bold tracking-wider drop-shadow-lg mb-8"
        style={{ 
          fontFamily: "'MedievalSharp', cursive",
          background: "linear-gradient(to right, #8B5CF6, #D946EF, #F97316)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
          filter: "drop-shadow(0 0 8px rgba(217, 70, 239, 0.3))"
        }}
      >
        Elleonor
      </h1>
      <button
        className="px-8 py-3 bg-game-primary/80 hover:bg-game-primary text-white rounded-lg text-xl font-semibold transition-colors duration-300 shadow-lg button-press"
        onClick={() => navigate("/game")}
      >
        Start Game
      </button>
    </div>
  );
};