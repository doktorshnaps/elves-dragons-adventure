import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Zap, Sparkles } from 'lucide-react';
import blockSound1 from '@/assets/sounds/blok-mechom.mp3';
import blockSound2 from '@/assets/sounds/blok-mechom-2.mp3';
import blockSound3 from '@/assets/sounds/blok-mechom-3.mp3';
import blockSound4 from '@/assets/sounds/blok-mechom-4.mp3';
import attackSound1 from '@/assets/sounds/mech-v-telo-1.mp3';
import attackSound2 from '@/assets/sounds/mech-v-telo-2.mp3';
import criticalSound from '@/assets/sounds/mech-razrubanie.mp3';

interface AttackAnimationProps {
  isActive: boolean;
  type: 'normal' | 'critical' | 'blocked';
  source: 'player' | 'enemy';
  attackerPosition?: { x: number; y: number };
  defenderPosition?: { x: number; y: number };
}

export const AttackAnimation: React.FC<AttackAnimationProps> = ({
  isActive,
  type,
  source,
  attackerPosition,
  defenderPosition
}) => {
  const [showImpact, setShowImpact] = useState(false);
  const blockSoundsRef = useRef<HTMLAudioElement[]>([]);
  const attackSoundsRef = useRef<HTMLAudioElement[]>([]);
  const criticalSoundRef = useRef<HTMLAudioElement | null>(null);

  // Инициализация аудио объектов
  useEffect(() => {
    blockSoundsRef.current = [
      new Audio(blockSound1),
      new Audio(blockSound2),
      new Audio(blockSound3),
      new Audio(blockSound4)
    ];
    
    attackSoundsRef.current = [
      new Audio(attackSound1),
      new Audio(attackSound2)
    ];
    
    criticalSoundRef.current = new Audio(criticalSound);
    
    // Настройка громкости
    blockSoundsRef.current.forEach(audio => {
      audio.volume = 0.5;
    });
    
    attackSoundsRef.current.forEach(audio => {
      audio.volume = 0.6;
    });
    
    if (criticalSoundRef.current) {
      criticalSoundRef.current.volume = 0.7;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      // Для всех типов атак показываем эффект попадания через 500мс (полет меча)
      const delay = 500;
      
      const timer = setTimeout(() => {
        setShowImpact(true);
      }, delay);

      return () => {
        clearTimeout(timer);
        setShowImpact(false);
      };
    } else {
      setShowImpact(false);
    }
  }, [isActive, type]);

  // Воспроизведение звуков атаки
  useEffect(() => {
    if (showImpact) {
      if (type === 'blocked') {
        const randomIndex = Math.floor(Math.random() * blockSoundsRef.current.length);
        const selectedSound = blockSoundsRef.current[randomIndex];
        selectedSound.currentTime = 0;
        selectedSound.play().catch(err => console.log('Block sound play failed:', err));
      } else if (type === 'critical') {
        if (criticalSoundRef.current) {
          criticalSoundRef.current.currentTime = 0;
          criticalSoundRef.current.play().catch(err => console.log('Critical sound play failed:', err));
        }
      } else if (type === 'normal') {
        const randomIndex = Math.floor(Math.random() * attackSoundsRef.current.length);
        const selectedSound = attackSoundsRef.current[randomIndex];
        selectedSound.currentTime = 0;
        selectedSound.play().catch(err => console.log('Attack sound play failed:', err));
      }
    }
  }, [showImpact, type]);

  if (!isActive) return null;

  // Определяем позиции атакующего и защищающегося
  const isPlayerAttacking = source === 'player';
  const startPos = attackerPosition || { x: 0, y: 0 };
  const endPos = defenderPosition || { x: 0, y: 0 };

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {/* Проектайл атаки - для всех типов атак */}
        {!showImpact && (
          <motion.div
            key="projectile"
            className="absolute"
            initial={{ 
              left: startPos.x,
              top: startPos.y,
              scale: 1,
              opacity: 1
            }}
            animate={{ 
              left: endPos.x,
              top: endPos.y,
              scale: 1,
              opacity: 1
            }}
            exit={{ 
              opacity: 0,
              scale: 0
            }}
            transition={{ 
              duration: 0.5,
              ease: 'easeInOut'
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: type === 'critical' ? [1, 1.3, 1] : 1
              }}
              transition={{
                duration: 0.5,
                ease: 'linear'
              }}
            >
              <Sword className={`w-12 h-12 ${type === 'critical' ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`} />
            </motion.div>
          </motion.div>
        )}

        {/* Эффект попадания - на защитнике */}
        {showImpact && (
          <motion.div
            key="impact"
            className="absolute"
            style={{
              left: endPos.x,
              top: endPos.y,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ 
              scale: 0,
              opacity: 1
            }}
            animate={{ 
              scale: type === 'blocked' ? [0, 1, 1.2, 0] : type === 'critical' ? [0, 1.2, 1.5, 0] : [0, 1.5, 2, 0],
              opacity: [1, 1, 0.8, 0]
            }}
            transition={{ 
              duration: type === 'blocked' ? 0.6 : 0.8,
              ease: 'easeOut'
            }}
          >
            {type === 'blocked' ? (
              // Анимация блокировки - щит
              <div className="relative">
                <Shield className="w-24 h-24 text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.9)]" />
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 0, 0.8]
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: 2
                  }}
                >
                  <div className="w-full h-full rounded-full border-4 border-blue-400" />
                </motion.div>
              </div>
            ) : type === 'critical' ? (
              // Критический удар - взрыв
              <div className="relative">
                <motion.div
                  className="w-32 h-32 rounded-full bg-gradient-radial from-yellow-400 via-orange-500 to-red-600"
                  animate={{
                    scale: [0, 1.5, 2],
                    opacity: [1, 0.6, 0]
                  }}
                  transition={{
                    duration: 0.8
                  }}
                />
                {/* Искры */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full"
                    animate={{
                      x: [0, Math.cos(i * Math.PI / 4) * 100],
                      y: [0, Math.sin(i * Math.PI / 4) * 100],
                      scale: [1, 0],
                      opacity: [1, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      ease: 'easeOut'
                    }}
                  />
                ))}
              </div>
            ) : (
              // Обычный удар - круговая волна
              <div className="relative">
                <motion.div
                  className="w-20 h-20 rounded-full border-4 border-red-500"
                  animate={{
                    scale: [0, 2],
                    opacity: [1, 0]
                  }}
                  transition={{
                    duration: 0.6
                  }}
                />
                <motion.div
                  className="absolute inset-0 w-20 h-20 rounded-full bg-red-500/50"
                  animate={{
                    scale: [0, 1.5],
                    opacity: [0.8, 0]
                  }}
                  transition={{
                    duration: 0.5
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Экранный эффект при критическом ударе */}
      {type === 'critical' && showImpact && (
        <motion.div
          className="absolute inset-0 bg-yellow-400/20"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.4, 0],
          }}
          transition={{ 
            duration: 0.4,
            times: [0, 0.5, 1]
          }}
        />
      )}

      {/* Экранный эффект при блокировке */}
      {type === 'blocked' && showImpact && (
        <motion.div
          className="absolute inset-0 bg-blue-400/15"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.3, 0],
          }}
          transition={{ 
            duration: 0.3,
            times: [0, 0.5, 1]
          }}
        />
      )}
    </div>
  );
};
