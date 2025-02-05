import React from 'react';
import { motion } from 'framer-motion';

interface ProjectileSpriteProps {
  x: number;
  y: number;
}

export const ProjectileSprite = ({ x, y }: ProjectileSpriteProps) => {
  return (
    <motion.div
      className="absolute w-4 h-4 bg-red-500 rounded-full"
      style={{
        left: x,
        bottom: y,
        boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    />
  );
};