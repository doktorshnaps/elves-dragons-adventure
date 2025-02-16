
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const GameTitle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartGame = () => {
    const isInitialized = localStorage.getItem('gameInitialized');
    if (!isInitialized) {
      localStorage.setItem('gameInitialized', 'true');
      toast({
        title: "Добро пожаловать в игру!",
        description: "Начните свое приключение",
      });
    }
    navigate("/menu");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center w-full max-h-screen flex flex-col items-center justify-center gap-6 p-4"
    >
      <h1 
        className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-wider drop-shadow-lg"
        style={{ 
          fontFamily: "'MedievalSharp', cursive",
          background: "linear-gradient(to right, #8B5CF6, #D946EF, #F97316)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
          filter: "drop-shadow(0 0 8px rgba(217, 70, 239, 0.3))",
          maxWidth: '100vw',
          wordWrap: 'break-word'
        }}
      >
        Elleonor
      </h1>
      <motion.button
        className="px-6 sm:px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-lg sm:text-xl font-semibold transition-colors duration-300 shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStartGame}
      >
        Начать игру
      </motion.button>
    </motion.div>
  );
};
