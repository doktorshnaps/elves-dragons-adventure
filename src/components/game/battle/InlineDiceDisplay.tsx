import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useBattleSpeed } from '@/contexts/BattleSpeedContext';

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
  label
}: InlineDiceDisplayProps) => {
  const { adjustDelay } = useBattleSpeed();
  const [displayValue, setDisplayValue] = useState<number>(1);
  const [isResultVisible, setIsResultVisible] = useState<boolean>(false);

  useEffect(() => {
    let intervalId: number | undefined;
    let stopTimeoutId: number | undefined;
    let resultTimeoutId: number | undefined;

    if (isRolling) {
      // Начинаем крутить числа (каждые 100мс), скрываем финальный результат
      setIsResultVisible(false);
      intervalId = window.setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);

      // Останавливаем смену чисел через 1200мс
      stopTimeoutId = window.setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
      }, adjustDelay(1200));
    } else if (diceValue !== null) {
      // Фиксируем финальный результат и держим его 1200мс
      setDisplayValue(diceValue);
      setIsResultVisible(true);
      
      resultTimeoutId = window.setTimeout(() => {
        setIsResultVisible(false);
      }, adjustDelay(1200));
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stopTimeoutId) clearTimeout(stopTimeoutId);
      if (resultTimeoutId) clearTimeout(resultTimeoutId);
    };
  }, [isRolling, diceValue, adjustDelay]);

  const isActive = isRolling || isResultVisible;

  return (
    <div className="relative flex items-center gap-1 sm:gap-2">
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
    </div>
  );
};
