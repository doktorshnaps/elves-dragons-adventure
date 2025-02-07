
import React from 'react';
import { motion } from 'framer-motion';

export interface Obstacle {
  id: number;
  position: number;
  type: 'spike' | 'pit';
  damage: number;
  triggered?: boolean;
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
        // Spike trap with increased damage visual
        <div className="w-8 h-48 flex items-end justify-center relative">
          <div 
            className={`absolute bottom-0 w-full h-full flex items-end justify-center ${
              obstacle.triggered ? 'opacity-50' : ''
            }`}
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(255,0,0,0.1))'
            }}
          >
            <div className="w-0 h-0 border-l-[16px] border-l-transparent border-b-[48px] border-b-red-600 border-r-[16px] border-r-transparent" />
          </div>
        </div>
      ) : (
        // Pit trap with increased height
        <div 
          className={`w-16 h-48 bg-gradient-to-b from-gray-900 to-black rounded-t-sm ${
            obstacle.triggered ? 'opacity-50' : ''
          }`}
          style={{
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.4), 0 -2px 4px -2px rgba(0, 0, 0, 0.2)'
          }}
        />
      )}
    </motion.div>
  );
};

