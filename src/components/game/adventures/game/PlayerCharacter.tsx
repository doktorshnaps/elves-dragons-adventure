import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface PlayerCharacterProps {
  position: number;
  yPosition: number;
  isAttacking: boolean;
  health: number;
  power: number;
  armor: number;
  maxArmor: number;
  level?: number;
  experience?: number;
  requiredExperience?: number;
}

export const PlayerCharacter = ({ 
  position, 
  yPosition,
  isAttacking,
  health,
  power,
  armor,
  maxArmor,
  level = 1,
  experience = 0,
  requiredExperience = 100
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
        {/* Stats Display */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-32 space-y-1">
          {/* Level Display */}
          <div className="text-center text-xs font-bold text-yellow-400 mb-1">
            Уровень {level}
          </div>
          
          {/* Health Bar */}
          <div className="relative">
            <div className="h-2 bg-red-900 rounded-full">
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-300 relative"
                style={{ width: `${(health / 100) * 100}%` }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold whitespace-nowrap">
                  {Math.floor(health)}/100
                </div>
              </div>
            </div>
          </div>
          
          {/* Armor Bar */}
          <div className="relative mt-1">
            <div className="h-2 bg-blue-900 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300 relative"
                style={{ width: `${(armor / maxArmor) * 100}%` }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold whitespace-nowrap">
                  {Math.floor(armor)}/{maxArmor}
                </div>
              </div>
            </div>
          </div>

          {/* Experience Bar */}
          <div className="relative mt-1">
            <div className="h-2 bg-purple-900 rounded-full">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-300 relative"
                style={{ width: `${(experience / requiredExperience) * 100}%` }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold whitespace-nowrap">
                  {experience}/{requiredExperience}
                </div>
              </div>
            </div>
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