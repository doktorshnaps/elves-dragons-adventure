import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGameData } from '@/hooks/useGameData';

export interface DragonEgg {
  id: string;
  petName: string;
  rarity: number;
  createdAt: string;
  faction?: string;
}

interface DragonEggContextType {
  eggs: DragonEgg[];
  addEgg: (egg: DragonEgg, faction: string) => void;
  removeEgg: (id: string) => void;
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
    const newEgg: DragonEgg = {
      ...egg,
      faction
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

  return (
    <DragonEggContext.Provider value={{ eggs, addEgg, removeEgg }}>
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