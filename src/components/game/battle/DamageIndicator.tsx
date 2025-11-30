import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DamageIndicatorProps {
  damage: number;
  isCritical?: boolean;
  isBlocked?: boolean;
  onComplete?: () => void;
}

export const DamageIndicator: React.FC<DamageIndicatorProps> = ({
  damage,
  isCritical,
  isBlocked,
  onComplete
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const color = isBlocked 
    ? 'text-blue-400' 
    : isCritical 
      ? 'text-red-500' 
      : 'text-yellow-400';

  const displayText = isBlocked 
    ? 'БЛОК!' 
    : damage > 0 
      ? `-${damage}` 
      : '0';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -50, scale: isCritical ? 1.5 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50`}
        >
          <div className={`${color} font-bold text-4xl drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] ${isCritical ? 'animate-pulse' : ''}`}>
            {displayText}
            {isCritical && !isBlocked && <span className="ml-2">🎯</span>}
            {isBlocked && <span className="ml-2">🛡️</span>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
