
import React from 'react';
import { motion } from 'framer-motion';

export interface Obstacle {
  id: number;
  position: number;
  type: 'spike' | 'pit';
  damage: number;
}

interface ObstacleSpriteProps {
  obstacle: Obstacle;
}

export const ObstacleSprite = ({ obstacle }: ObstacleSpriteProps) => {
  return (
    <motion.div
      className="absolute bottom-[50px] z-10"
      style={{ left: obstacle.position }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {obstacle.type === 'spike' ? (
        <div className="w-8 h-8 flex items-end justify-center">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-b-[20px] border-b-red-600 border-r-[12px] border-r-transparent" />
        </div>
      ) : (
        <div className="w-16 h-4 bg-gray-900 rounded-sm" />
      )}
    </motion.div>
  );
};
