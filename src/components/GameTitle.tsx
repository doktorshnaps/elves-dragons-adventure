import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const GameTitle = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center cursor-pointer group"
    >
      <motion.h1 
        className="text-6xl md:text-8xl font-bold text-white tracking-wider drop-shadow-lg mb-8"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        Elleonor
      </motion.h1>
      <motion.button
        className="px-8 py-3 bg-game-primary/80 hover:bg-game-primary text-white rounded-lg text-xl font-semibold transition-colors duration-300 shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/game")}
      >
        Start Game
      </motion.button>
    </motion.div>
  );
};