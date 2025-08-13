import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGameData } from '@/hooks/useGameData';

export interface DragonEgg {
  id: string;
  petName: string;
  rarity: number;
  createdAt: string;
  faction?: string;
  incubationStarted?: boolean;
}

interface DragonEggContextType {
  eggs: DragonEgg[];
  addEgg: (egg: DragonEgg, faction: string) => void;
  removeEgg: (id: string) => void;
  startIncubation: (id: string) => void;
}

const DragonEggContext = createContext<DragonEggContextType | undefined>(undefined);

export const DragonEggProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gameData, updateGameData } = useGameData();
  const [eggs, setEggs] = useState<DragonEgg[]>(() => {
    return gameData.dragonEggs || [];
  });

  useEffect(() => {
    setEggs(gameData.dragonEggs || []);
  }, [gameData.dragonEggs]);

const addEgg = async (egg: DragonEgg, faction: string) => {
    // Защита от дублей: если яйцо с таким id уже есть, ничего не делаем
    if (eggs.some((e) => e.id === egg.id)) return;

    const newEgg: DragonEgg = {
      ...egg,
      faction,
      incubationStarted: egg.incubationStarted ?? false
    };
    const newEggs = [...eggs, newEgg];
    setEggs(newEggs);
    await updateGameData({ dragonEggs: newEggs });
  };

const removeEgg = async (id: string) => {
    const newEggs = eggs.filter(egg => egg.id !== id);
    setEggs(newEggs);
    await updateGameData({ dragonEggs: newEggs });
  };

  const startIncubation = async (id: string) => {
    const newEggs = eggs.map(egg => egg.id === id 
      ? { ...egg, incubationStarted: true, createdAt: new Date().toISOString() } 
      : egg);
    setEggs(newEggs);
    await updateGameData({ dragonEggs: newEggs });
  };

return (
    <DragonEggContext.Provider value={{ eggs, addEgg, removeEgg, startIncubation }}>
      {children}
    </DragonEggContext.Provider>
  );
};

export const useDragonEggs = () => {
  const context = useContext(DragonEggContext);
  if (context === undefined) {
    throw new Error('useDragonEggs must be used within a DragonEggProvider');
  }
  return context;
};