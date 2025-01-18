import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [eggs, setEggs] = useState<DragonEgg[]>(() => {
    const savedEggs = localStorage.getItem('dragonEggs');
    return savedEggs ? JSON.parse(savedEggs) : [];
  });

  useEffect(() => {
    const handleEggsUpdate = () => {
      const savedEggs = localStorage.getItem('dragonEggs');
      if (savedEggs) {
        setEggs(JSON.parse(savedEggs));
      }
    };

    window.addEventListener('eggsUpdate', handleEggsUpdate);
    return () => {
      window.removeEventListener('eggsUpdate', handleEggsUpdate);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('dragonEggs', JSON.stringify(eggs));
  }, [eggs]);

  const addEgg = (egg: DragonEgg, faction: string) => {
    const newEgg: DragonEgg = {
      ...egg,
      faction
    };
    setEggs([...eggs, newEgg]);
  };

  const removeEgg = (id: string) => {
    setEggs(eggs.filter(egg => egg.id !== id));
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