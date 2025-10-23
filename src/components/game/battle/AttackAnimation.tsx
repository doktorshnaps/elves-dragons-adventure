import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Zap, Sparkles } from 'lucide-react';

interface AttackAnimationProps {
  isActive: boolean;
  type: 'normal' | 'critical' | 'blocked';
  source: 'player' | 'enemy';
}

export const AttackAnimation: React.FC<AttackAnimationProps> = ({
  isActive,
  type,
  source
}) => {
  const [showImpact, setShowImpact] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Показываем эффект попадания через 500мс после начала атаки
      const timer = setTimeout(() => {
        setShowImpact(true);
      }, 500);

      return () => {
        clearTimeout(timer);
        setShowImpact(false);
      };
    } else {
      setShowImpact(false);
    }
  }, [isActive]);

  if (!isActive) return null;

  // Определяем направление атаки (игрок сверху, враг снизу)
  const isPlayerAttacking = source === 'player';
  const startY = isPlayerAttacking ? '0%' : '100%';
  const endY = isPlayerAttacking ? '100%' : '0%';

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {/* Проектайл атаки */}
        {!showImpact && (
          <motion.div
            key="projectile"
            className="absolute left-1/2 -translate-x-1/2"
            initial={{ 
              y: startY,
              scale: 1,
              opacity: 1
            }}
            animate={{ 
              y: endY,
              scale: type === 'critical' ? [1, 1.5, 1.2] : 1,
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
            {type === 'critical' ? (
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 0.5,
                    ease: 'linear'
                  }}
                >
                  <Zap className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                </motion.div>
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    scale: [0.8, 1.5, 0.8],
                    opacity: [0.8, 0.3, 0.8]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity
                  }}
                >
                  <Sparkles className="w-16 h-16 text-yellow-300" />
                </motion.div>
              </div>
            ) : (
              <motion.div
                animate={{
                  rotate: isPlayerAttacking ? [0, 180] : [180, 360]
                }}
                transition={{
                  duration: 0.5,
                  ease: 'linear'
                }}
              >
                <Sword className="w-12 h-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Эффект попадания */}
        {showImpact && (
          <motion.div
            key="impact"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ 
              scale: 0,
              opacity: 1
            }}
            animate={{ 
              scale: type === 'blocked' ? [0, 1, 1.2, 0] : [0, 1.5, 2, 0],
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
