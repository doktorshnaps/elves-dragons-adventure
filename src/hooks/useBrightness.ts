import { useContext } from 'react';
import { BrightnessContext } from '@/contexts/BrightnessContext';

export const useBrightness = () => {
  const ctx = useContext(BrightnessContext);
  if (!ctx) {
    console.warn('useBrightness used outside of BrightnessProvider.');
    const brightness = parseFloat(localStorage.getItem('game-brightness') || '100');
    const setBrightness = (value: number) => localStorage.setItem('game-brightness', value.toString());
    return { brightness, setBrightness };
  }
  return ctx;
};
