
import React from 'react';
import { motion } from 'framer-motion';

export interface Chest {
  id: number;
  position: number;
  collected: boolean;
}

interface ChestSpriteProps {
  chest: Chest;
}

export const ChestSprite = ({ chest }: ChestSpriteProps) => {
  return (
    <motion.div
      className="absolute bottom-[50px]"
      style={{ left: chest.position }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className={`w-12 h-12 relative ${chest.collected ? 'opacity-50' : ''}`}
        style={{
          backgroundImage: 'url("/lovable-uploads/54fc94d0-0050-4f98-99b9-58cec6e45173.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      >
        {!chest.collected && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-4 h-4 bg-yellow-400 rounded-full opacity-75"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
