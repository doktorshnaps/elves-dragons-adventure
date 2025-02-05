import React from 'react';
import { motion } from 'framer-motion';

interface MagicProjectileProps {
  x: number;
  y: number;
  direction: number;
}

export const MagicProjectile = ({ x, y, direction }: MagicProjectileProps) => {
  return (
    <motion.div
      className="absolute w-8 h-8 bg-blue-500/50 rounded-full"
      style={{
        left: x,
        bottom: y + 30,
        boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
      }}
      initial={{ scale: 0, x: 0 }}
      animate={{ 
        scale: [0, 1.2, 0],
        x: direction * 100,
      }}
      transition={{ duration: 0.3 }}
    />
  );
};