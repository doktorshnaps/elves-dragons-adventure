import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface InlineDiceDisplayProps {
  isRolling: boolean;
  diceValue: number | null;
  isAttacker: boolean;
  label?: string;
  damage?: number;
  isBlocked?: boolean;
  isCritical?: boolean;
}

export const InlineDiceDisplay = ({
  isRolling,
  diceValue,
  isAttacker,
  label,
  damage,
  isBlocked,
  isCritical
}: InlineDiceDisplayProps) => {
  const [displayValue, setDisplayValue] = useState<number>(1);
  const [isResultVisible, setIsResultVisible] = useState<boolean>(false);
  const [showDamage, setShowDamage] = useState<boolean>(false);

  useEffect(() => {
    let intervalId: number | undefined;
    let stopTimeoutId: number | undefined;
    let resultTimeoutId: number | undefined;
    let damageTimeoutId: number | undefined;

    if (isRolling) {
      // Начинаем крутить числа (каждые 100мс), скрываем финальный результат и урон
      setIsResultVisible(false);
      setShowDamage(false);
      intervalId = window.setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);

      // Останавливаем смену чисел через 1200мс
      stopTimeoutId = window.setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
      }, 1200);
    } else if (diceValue !== null) {
      // Фиксируем финальный результат и держим его 1200мс
      setDisplayValue(diceValue);
      setIsResultVisible(true);
      
      // Показываем урон/блок после небольшой задержки
      if (damage !== undefined || isBlocked !== undefined) {
        damageTimeoutId = window.setTimeout(() => {
          setShowDamage(true);
          
          // Скрываем урон/блок через 2000мс (больше времени для критического урона)
          setTimeout(() => {
            setShowDamage(false);
          }, isCritical ? 2000 : 1500);
        }, 200);
      }
      
      resultTimeoutId = window.setTimeout(() => {
        setIsResultVisible(false);
      }, 1200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stopTimeoutId) clearTimeout(stopTimeoutId);
      if (resultTimeoutId) clearTimeout(resultTimeoutId);
      if (damageTimeoutId) clearTimeout(damageTimeoutId);
    };
  }, [isRolling, diceValue, damage, isBlocked, isCritical]);

  const isActive = isRolling || isResultVisible;

  const isPlayerDice = label === 'Игрок';

  // Урон и блок показываются только у защищающегося (!isAttacker)
  const isDefender = !isAttacker;
  const notificationOnLeft = showDamage && isDefender && isPlayerDice;
  const notificationOnRight = showDamage && isDefender && !isPlayerDice;

  return (
    <div className="relative flex items-center gap-1 sm:gap-2">
      {/* Damage/Block notification - Left side (player defending) */}
      {notificationOnLeft && (
        <motion.div
          initial={{ scale: 0, opacity: 0, x: 20 }}
          animate={{ 
            scale: isCritical ? [1, 1.1, 1] : 1, 
            opacity: 1, 
            x: 0 
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: isCritical ? 0.5 : 0.3,
            repeat: isCritical ? 2 : 0
          }}
          className="absolute -left-20 sm:-left-32 whitespace-nowrap"
        >
          {isBlocked ? (
            <div className="bg-blue-500/90 border border-blue-300 sm:border-2 rounded-lg px-2 py-1 sm:px-4 sm:py-2 shadow-lg">
              <div className="text-sm sm:text-2xl font-bold text-white text-center">БЛОК</div>
            </div>
          ) : isCritical ? (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 border border-yellow-300 sm:border-2 rounded-lg px-2 py-1 sm:px-4 sm:py-2 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse">
              <div className="text-[9px] sm:text-xs font-bold text-yellow-100 text-center">CRITICAL</div>
              <div className="text-lg sm:text-3xl font-bold text-white text-center">-{damage}</div>
            </div>
          ) : (
            <div className="bg-red-500/90 border border-red-300 sm:border-2 rounded-lg px-2 py-1 sm:px-4 sm:py-2 shadow-lg">
              <div className="text-lg sm:text-3xl font-bold text-white text-center">-{damage}</div>
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ 
          scale: isRolling ? [1, 1.05, 1] : 1,
          opacity: 1,
          rotate: isRolling ? 360 : 0
        }}
        transition={{ 
          duration: isRolling ? 1 : 0.6,
          repeat: isRolling ? Infinity : 0,
          ease: "easeInOut" 
        }}
        className="flex flex-col items-center"
      >
        <div className={`${
          isAttacker 
            ? 'bg-red-500/90 border-red-300 shadow-red-500/50' 
            : 'bg-blue-500/90 border-blue-300 shadow-blue-500/50'
        } backdrop-blur-sm rounded-lg p-1.5 sm:p-2.5 shadow-xl border sm:border-2 w-14 sm:w-20 h-[52px] sm:h-[76px] flex flex-col justify-center`}>
          <div className={`text-[9px] sm:text-xs ${isAttacker ? 'text-red-100' : 'text-blue-100'} mb-0.5 text-center font-medium`}>
            {isAttacker ? '⚔️' : '🛡️'} {label || (isAttacker ? 'Атака' : 'Защита')}
          </div>
          <div className="text-xl sm:text-3xl font-bold text-white text-center">
            {isActive ? displayValue : '?'}
          </div>
        </div>
      </motion.div>

      {/* Damage/Block notification - Right side (monster defending) */}
      {notificationOnRight && (
        <motion.div
          initial={{ scale: 0, opacity: 0, x: -20 }}
          animate={{ 
            scale: isCritical ? [1, 1.1, 1] : 1, 
            opacity: 1, 
            x: 0 
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: isCritical ? 0.5 : 0.3,
            repeat: isCritical ? 2 : 0
          }}
          className="absolute -right-20 sm:-right-32 whitespace-nowrap"
        >
          {isBlocked ? (
            <div className="bg-blue-500/90 border border-blue-300 sm:border-2 rounded-lg px-2 py-1 sm:px-4 sm:py-2 shadow-lg">
              <div className="text-sm sm:text-2xl font-bold text-white text-center">БЛОК</div>
            </div>
          ) : isCritical ? (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 border border-yellow-300 sm:border-2 rounded-lg px-2 py-1 sm:px-4 sm:py-2 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse">
              <div className="text-[9px] sm:text-xs font-bold text-yellow-100 text-center">CRITICAL</div>
              <div className="text-lg sm:text-3xl font-bold text-white text-center">-{damage}</div>
            </div>
          ) : (
            <div className="bg-red-500/90 border border-red-300 sm:border-2 rounded-lg px-2 py-1 sm:px-4 sm:py-2 shadow-lg">
              <div className="text-lg sm:text-3xl font-bold text-white text-center">-{damage}</div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
