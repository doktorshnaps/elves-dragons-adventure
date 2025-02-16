
import React from 'react';
import { motion } from 'framer-motion';

interface GameOverlayProps {
  isGameOver: boolean;
}

export const GameOverlay = ({ isGameOver }: GameOverlayProps) => {
  if (!isGameOver) return null;

  return (
    <motion.div 
      className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center space-y-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <div className="text-6xl font-bold text-red-500">
          Вы погибли
        </div>
        <div className="text-2xl text-white">
          Возрождение через 2 секунды...
        </div>
      </motion.div>
    </motion.div>
  );
};
