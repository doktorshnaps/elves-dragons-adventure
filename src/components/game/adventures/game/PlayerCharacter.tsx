import React from 'react';
import { motion } from 'framer-motion';

interface PlayerCharacterProps {
  position: number;
  isAttacking: boolean;
  health: number;
  power: number;
}

export const PlayerCharacter = ({ 
  position, 
  isAttacking,
  health,
  power 
}: PlayerCharacterProps) => {
  return (
    <motion.div
      className="absolute bottom-[50px]"
      style={{ left: position }}
      animate={{
        scale: isAttacking ? 1.2 : 1,
        transition: { duration: 0.2 }
      }}
    >
      <div className="relative">
        {/* Health bar */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20">
          <div className="h-2 bg-red-900 rounded-full">
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-300"
              style={{ width: `${(health / 100) * 100}%` }}
            />
          </div>
        </div>

        {/* Character sprite */}
        <div className="w-12 h-16 bg-game-primary rounded-lg flex items-center justify-center text-white font-bold">
          {isAttacking ? '⚔️' : '🧙‍♂️'}
        </div>
      </div>
    </motion.div>
  );
};