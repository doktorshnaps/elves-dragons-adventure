
import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Shield } from 'lucide-react';
import { StatusBar } from './components/StatusBar';
import { HealthBar } from './components/HealthBar';

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
  maxHealth: number;
}

export const PlayerCharacter = ({
  position,
  yPosition,
  isAttacking,
  health,
  maxHealth,
  power,
  armor,
  maxArmor,
  level = 1,
  experience = 0,
  requiredExperience = 100
}: PlayerCharacterProps) => {
  const characterControls = useAnimation();
  const attackControls = useAnimation();

  useEffect(() => {
    if (!isAttacking) {
      characterControls.start({
        y: [-2, 2, -2],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    } else {
      characterControls.stop();
    }
  }, [isAttacking, characterControls]);

  useEffect(() => {
    if (isAttacking) {
      attackControls.start({
        x: [0, 20, 0],
        rotate: [0, -15, 15, 0],
        scale: [1, 1.3, 1],
        transition: {
          duration: 0.4,
          times: [0, 0.5, 1]
        }
      });
    }
  }, [isAttacking, attackControls]);

  return (
    <motion.div
      className="absolute bottom-[50px] z-10"
      style={{ 
        left: position,
        transform: `translateY(${-yPosition}px)`
      }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
    >
      <div className="relative">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-32 space-y-1">
          <div className="text-center text-xs font-bold text-yellow-400 mb-1">
            Уровень {level}
          </div>
          
          <div className="flex flex-col gap-1">
            <HealthBar 
              current={health}
              max={maxHealth}
              className="bg-red-900"
              indicatorClassName="bg-red-500"
              label="Здоровье"
            />

            <StatusBar 
              current={armor}
              max={maxArmor}
              className="bg-blue-900"
              indicatorClassName="bg-blue-500"
              label="Броня"
            />

            <StatusBar 
              current={experience}
              max={requiredExperience}
              className="bg-purple-900"
              indicatorClassName="bg-purple-500"
              label="Опыт"
            />
          </div>
        </div>

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

        <motion.div
          className="w-12 h-16 bg-game-primary rounded-lg flex items-center justify-center text-2xl relative"
          animate={characterControls}
        >
          <motion.div
            animate={attackControls}
            className="w-full h-full flex items-center justify-center"
          >
            {isAttacking ? '⚔️' : '🧙‍♂️'}
          </motion.div>
          
          {armor > 0 && (
            <motion.div
              className="absolute -top-4 -right-4"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
                transition: {
                  duration: 1,
                  repeat: Infinity
                }
              }}
            >
              <Shield className="w-4 h-4 text-blue-500" />
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
