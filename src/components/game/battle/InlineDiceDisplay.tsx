import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface InlineDiceDisplayProps {
  isRolling: boolean;
  diceValue: number | null;
  isAttacker: boolean;
  label?: string;
}

export const InlineDiceDisplay = ({
  isRolling,
  diceValue,
  isAttacker,
  label
}: InlineDiceDisplayProps) => {
  const [displayValue, setDisplayValue] = useState<number>(1);
  const [showDice, setShowDice] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setShowDice(true);
      // Анимация случайных чисел во время броска
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);

      return () => clearInterval(interval);
    } else if (diceValue !== null) {
      // Показываем финальное значение
      setDisplayValue(diceValue);
      // Скрываем через 2 секунды после остановки
      const timeout = setTimeout(() => {
        setShowDice(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isRolling, diceValue]);

  return (
    <AnimatePresence>
      {showDice && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{ 
            scale: isRolling ? [1, 1.1, 1] : 1,
            opacity: 1,
            rotate: isRolling ? 360 : 0
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: isRolling ? 0.3 : 0.6,
            repeat: isRolling ? Infinity : 0,
            ease: "easeInOut" 
          }}
          className="flex flex-col items-center"
        >
          <div className={`${
            isAttacker 
              ? 'bg-red-500/90 border-red-300 shadow-red-500/50' 
              : 'bg-blue-500/90 border-blue-300 shadow-blue-500/50'
          } backdrop-blur-sm rounded-lg p-3 shadow-xl border-2`}>
            <div className={`text-xs ${isAttacker ? 'text-red-100' : 'text-blue-100'} mb-1 text-center font-medium`}>
              {isAttacker ? '⚔️' : '🛡️'} {label || (isAttacker ? 'Атака' : 'Защита')}
            </div>
            <div className="text-3xl font-bold text-white text-center">
              {displayValue}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
