import React, { createContext, useContext, useState, useCallback } from 'react';

type BattleSpeed = 1 | 2 | 4;

interface BattleSpeedContextType {
  speed: BattleSpeed;
  setSpeed: (speed: BattleSpeed) => void;
  adjustDelay: (baseDelay: number) => number;
}

const BattleSpeedContext = createContext<BattleSpeedContextType | undefined>(undefined);

export const BattleSpeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [speed, setSpeed] = useState<BattleSpeed>(1);

  const adjustDelay = useCallback((baseDelay: number) => {
    return Math.floor(baseDelay / speed);
  }, [speed]);

  return (
    <BattleSpeedContext.Provider value={{ speed, setSpeed, adjustDelay }}>
      {children}
    </BattleSpeedContext.Provider>
  );
};

export const useBattleSpeed = () => {
  const context = useContext(BattleSpeedContext);
  if (!context) {
    throw new Error('useBattleSpeed must be used within BattleSpeedProvider');
  }
  return context;
};
