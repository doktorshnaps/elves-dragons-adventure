import { motion } from 'framer-motion';

export const GameOver = () => {
  return (
    <motion.div 
      className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="text-6xl font-bold text-red-500"
      >
        Game Over
      </motion.div>
    </motion.div>
  );
};