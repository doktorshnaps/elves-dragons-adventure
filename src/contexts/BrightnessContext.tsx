import { createContext, useEffect, useMemo, useState, ReactNode } from 'react';

interface BrightnessContextValue {
  brightness: number;
  setBrightness: (value: number) => void;
  backgroundBrightness: number;
  setBackgroundBrightness: (value: number) => void;
}

export const BrightnessContext = createContext<BrightnessContextValue | undefined>(undefined);

export const BrightnessProvider = ({ children }: { children: ReactNode }) => {
  const [brightness, setBrightness] = useState<number>(() => {
    const saved = localStorage.getItem('game-brightness');
    return saved ? parseFloat(saved) : 100;
  });

  const [backgroundBrightness, setBackgroundBrightness] = useState<number>(() => {
    const saved = localStorage.getItem('game-background-brightness');
    return saved ? parseFloat(saved) : 100;
  });

  useEffect(() => {
    localStorage.setItem('game-brightness', brightness.toString());
    document.documentElement.style.setProperty('--game-brightness', `${brightness}%`);
  }, [brightness]);

  useEffect(() => {
    localStorage.setItem('game-background-brightness', backgroundBrightness.toString());
    document.documentElement.style.setProperty('--game-background-brightness', `${backgroundBrightness}%`);
  }, [backgroundBrightness]);

  const value = useMemo(() => ({ brightness, setBrightness, backgroundBrightness, setBackgroundBrightness }), [brightness, backgroundBrightness]);

  return (
    <BrightnessContext.Provider value={value}>
      {children}
    </BrightnessContext.Provider>
  );
};
