
import React from 'react';
import { Monster } from '../../types';
import { GameWorld } from '../../components/GameWorld';
import { TargetedMonster } from '../types/combatTypes';
import { motion } from 'framer-motion';
import { Heart, Shield, Star } from 'lucide-react';

interface GameWorldContainerProps {
  gameRef: React.RefObject<HTMLDivElement>;
  cameraOffset: number;
  playerPosition: number;
  playerY: number;
  isAttacking: boolean;
  currentHealth: number;
  playerPower: number;
  monsters: Monster[];
  projectiles: any[];
  onSelectTarget: (monster: Monster) => void;
  targetedMonster: TargetedMonster | null;
  armor: number;
  maxArmor: number;
  maxHealth: number;
  level?: number;
  experience?: number;
  requiredExperience?: number;
  balance: number;
}

export const GameWorldContainer = ({
  gameRef,
  cameraOffset,
  playerPosition,
  playerY,
  isAttacking,
  currentHealth,
  playerPower,
  monsters,
  projectiles,
  onSelectTarget,
  targetedMonster,
  armor,
  maxArmor,
  maxHealth,
  level = 1,
  experience = 0,
  requiredExperience = 100,
  balance
}: GameWorldContainerProps) => {
  const isFullArmor = armor === maxArmor;

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Player Interface - Positioned relative to game container */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-4 z-50 w-full px-4">
        <div className="max-w-[400px] mx-auto space-y-2">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <div className="w-full h-4 bg-red-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 1 }}
                whileTap={{ scaleX: 0.98 }}
                className="h-full rounded-full transition-all duration-300 relative"
                style={{ 
                  width: `${(currentHealth / maxHealth) * 100}%`,
                  background: 'linear-gradient(90deg, rgb(239, 68, 68) 0%, rgb(248, 113, 113) 100%)'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                  {Math.floor(currentHealth)}/{maxHealth} HP
                </div>
              </motion.div>
            </div>
          </div>

          {/* Armor Bar */}
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <div className="w-full h-4 bg-blue-900 rounded-full overflow-hidden relative">
              {isFullArmor && (
                <div className="absolute inset-0 rounded-full animate-pulse" 
                  style={{
                    boxShadow: '0 0 15px 2px rgba(59, 130, 246, 0.5)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                />
              )}
              <motion.div 
                className="h-full rounded-full transition-all duration-300 relative"
                style={{ 
                  width: `${(armor / maxArmor) * 100}%`,
                  background: 'linear-gradient(90deg, rgb(59, 130, 246) 0%, rgb(96, 165, 250) 100%)'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                  ARMOR {Math.floor(armor)}/{maxArmor}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Experience Bar with Level */}
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <div className="w-full h-4 bg-purple-900 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full transition-all duration-300 relative"
                  style={{ 
                    width: `${(experience / requiredExperience) * 100}%`,
                    background: 'linear-gradient(90deg, rgb(168, 85, 247) 0%, rgb(192, 132, 252) 100%)'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                    EXP {experience}/{requiredExperience}
                  </div>
                </motion.div>
              </div>
            </div>
            <div className="flex items-center justify-center bg-yellow-500 rounded-full w-8 h-8">
              <span className="text-sm font-bold text-white">{level}</span>
            </div>
          </div>
        </div>
      </div>

      <GameWorld
        gameRef={gameRef}
        cameraOffset={cameraOffset}
        playerPosition={playerPosition}
        playerY={playerY}
        isAttacking={isAttacking}
        currentHealth={currentHealth}
        playerPower={playerPower}
        monsters={monsters}
        projectiles={projectiles}
        onSelectTarget={onSelectTarget}
        targetedMonster={targetedMonster}
        armor={armor}
        maxArmor={maxArmor}
        maxHealth={maxHealth}
        level={level}
        experience={experience}
        requiredExperience={requiredExperience}
        balance={balance}
      />
    </div>
  );
};
