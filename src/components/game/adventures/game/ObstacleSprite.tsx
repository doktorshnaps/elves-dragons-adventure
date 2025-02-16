
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
      className={`absolute bottom-[50px] z-10 ${
        obstacle.triggered ? 'opacity-50' : ''
      }`}
      style={{ left: obstacle.position }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {obstacle.type === 'spike' ? (
        <div className="w-8 h-12 flex items-end justify-center">
          <div className="w-full h-full flex items-end justify-center bg-red-500/20">
            <div 
              className="w-0 h-0 border-l-[16px] border-l-transparent border-b-[32px] border-b-red-600 border-r-[16px] border-r-transparent"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            />
          </div>
        </div>
      ) : (
        <div className="w-16 h-12 relative">
          <div 
            className="absolute inset-0 bg-black rounded-t-sm"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,1))',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        </div>
      )}
    </motion.div>
  );
};
