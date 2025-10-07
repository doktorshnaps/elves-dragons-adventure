import { createContext, useEffect, useMemo, useState, ReactNode } from 'react';

interface BrightnessContextValue {
  brightness: number;
  setBrightness: (value: number) => void;
}

export const BrightnessContext = createContext<BrightnessContextValue | undefined>(undefined);

export const BrightnessProvider = ({ children }: { children: ReactNode }) => {
  const [brightness, setBrightness] = useState<number>(() => {
    const saved = localStorage.getItem('game-brightness');
    return saved ? parseFloat(saved) : 75;
  });

  useEffect(() => {
    localStorage.setItem('game-brightness', brightness.toString());
    // Apply brightness to the root element
    document.documentElement.style.setProperty('--game-brightness', `${brightness}%`);
  }, [brightness]);

  const value = useMemo(() => ({ brightness, setBrightness }), [brightness]);

  return (
    <BrightnessContext.Provider value={value}>
      {children}
    </BrightnessContext.Provider>
  );
};
