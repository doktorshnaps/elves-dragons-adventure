import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface GameTitleProps {
  isEnabled: boolean;
}

export const GameTitle = ({ isEnabled }: GameTitleProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center cursor-pointer group mb-8"
    >
      <h1 
        className="text-7xl md:text-9xl font-bold tracking-wider drop-shadow-lg mb-8 font-['Luminari']"
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
      <motion.button
        className={`px-8 py-3 ${
          isEnabled 
            ? "bg-game-primary/80 hover:bg-game-primary text-white" 
            : "bg-gray-500 cursor-not-allowed"
        } rounded-lg text-xl font-semibold transition-colors duration-300 shadow-lg`}
        whileHover={isEnabled ? { scale: 1.05 } : {}}
        whileTap={isEnabled ? { scale: 0.95 } : {}}
        onClick={() => isEnabled && navigate("/game")}
        disabled={!isEnabled}
      >
        {isEnabled ? "Start Game" : "Требуется авторизация"}
      </motion.button>
    </motion.div>
  );
};