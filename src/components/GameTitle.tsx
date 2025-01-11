import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const GameTitle = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center cursor-pointer group relative z-10"
      onClick={() => navigate("/game")}
    >
      <motion.h1 
        className="text-6xl md:text-8xl font-bold text-white tracking-wider drop-shadow-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        Elleonor
      </motion.h1>
    </motion.div>
  );
};