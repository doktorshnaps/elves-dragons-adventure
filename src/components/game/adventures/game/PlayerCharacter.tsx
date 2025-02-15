
import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Shield, Sword } from 'lucide-react';
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
      // Анимация покачивания в воздухе
      if (yPosition > 0) {
        characterControls.start({
          rotate: [-2, 2, -2],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }
        });
      } else {
        // Анимация дыхания на земле
        characterControls.start({
          y: [-2, 0, -2],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        });
      }
    } else {
      characterControls.stop();
    }
  }, [isAttacking, yPosition, characterControls]);

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
    <>
      <motion.div
        className="absolute z-10"
        style={{ 
          left: position,
          bottom: `${50 + yPosition}px`,
          filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))'
        }}
        animate={characterControls}
        transition={{ 
          type: 'spring',
          stiffness: 300,
          damping: 20
        }}
      >
        <div className="relative">
          {/* Индикатор атаки */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg">
            <Sword className="w-4 h-4 text-white mr-1" />
            <span className="text-xs font-bold text-white">{power}</span>
          </div>

          {/* Щит брони */}
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

          {/* Персонаж */}
          <motion.div
            className="w-16 h-20 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl relative overflow-hidden"
            animate={attackControls}
          >
            <motion.div
              className="w-full h-full flex items-center justify-center"
              animate={isAttacking ? { scale: [1, 1.2, 1] } : {}}
            >
              {isAttacking ? '⚔️' : '🧙‍♂️'}
            </motion.div>
            
            {/* Эффект брони */}
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

            {/* Эффект следа при движении */}
            <motion.div
              className="absolute inset-0 bg-blue-400/30"
              initial={{ scaleX: 0, originX: 1 }}
              animate={{ scaleX: 1, originX: 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Интерфейс статов */}
      <div className="fixed bottom-0 left-0 w-full px-4 pb-2 z-20">
        <div className="flex flex-col gap-1 max-w-[400px] mx-auto">
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

      {/* Уровень */}
      <div className="fixed bottom-2 right-4 z-20">
        <div className="bg-yellow-500/80 backdrop-blur-sm px-3 py-1 rounded-lg text-white font-bold">
          Уровень {level}
        </div>
      </div>
    </>
  );
};
