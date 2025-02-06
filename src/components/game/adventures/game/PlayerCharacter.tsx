import React from 'react';
import { motion } from 'framer-motion';

interface PlayerCharacterProps {
  position: number;
  yPosition: number;
  isAttacking: boolean;
  health: number;
  power: number;
}

export const PlayerCharacter = ({ 
  position, 
  yPosition,
  isAttacking,
  health,
  power 
}: PlayerCharacterProps) => {
  return (
    <motion.div
      className="absolute z-10"
      style={{ 
        left: position,
        bottom: 50 + yPosition
      }}
      animate={{
        scale: isAttacking ? 1.2 : 1,
        transition: { duration: 0.2 }
      }}
    >
      <div className="relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20">
          <div className="h-2 bg-red-900 rounded-full">
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-300"
              style={{ width: `${(health / 100) * 100}%` }}
            />
          </div>
        </div>

        <div 
          className="w-12 h-16 bg-game-primary rounded-lg flex items-center justify-center text-2xl"
          style={{
            transform: `translateY(${yPosition > 0 ? -2 : 0}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {isAttacking ? '⚔️' : '🧙‍♂️'}
        </div>
      </div>
    </motion.div>
  );
};