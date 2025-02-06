import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface PlayerCharacterProps {
  position: number;
  yPosition: number;
  isAttacking: boolean;
  health: number;
  power: number;
  armor: number; // Added armor prop
  maxArmor: number; // Added maxArmor prop
}

export const PlayerCharacter = ({ 
  position, 
  yPosition,
  isAttacking,
  health,
  power,
  armor,
  maxArmor
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
        {/* Health and Armor Bars */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 space-y-1">
          {/* Health Bar */}
          <div className="h-2 bg-red-900 rounded-full">
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-300"
              style={{ width: `${(health / 100) * 100}%` }}
            />
          </div>
          
          {/* Armor Bar */}
          <div className="h-2 bg-blue-900 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(armor / maxArmor) * 100}%` }}
            />
          </div>
        </div>

        {/* Shield Animation */}
        {armor > 0 && (
          <div className="absolute inset-0 -m-2">
            <div className="w-full h-full rounded-full border-2 border-blue-500/50 animate-pulse" />
            <motion.div 
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0.2, scale: 0.8 }}
              animate={{ 
                opacity: [0.2, 0.4, 0.2],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-full h-full rounded-full bg-blue-500/20" />
            </motion.div>
          </div>
        )}

        {/* Character */}
        <div 
          className="w-12 h-16 bg-game-primary rounded-lg flex items-center justify-center text-2xl relative"
          style={{
            transform: `translateY(${yPosition > 0 ? -2 : 0}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {isAttacking ? '⚔️' : '🧙‍♂️'}
          {armor > 0 && (
            <Shield className="absolute -top-4 -right-4 w-4 h-4 text-blue-500" />
          )}
        </div>
      </div>
    </motion.div>
  );
};