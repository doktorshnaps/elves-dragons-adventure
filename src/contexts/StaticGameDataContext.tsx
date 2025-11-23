import { createContext, useContext, ReactNode } from 'react';
import { useStaticGameData } from '@/hooks/useStaticGameData';

const StaticGameDataContext = createContext<ReturnType<typeof useStaticGameData> | null>(null);

export const StaticGameDataProvider = ({ children }: { children: ReactNode }) => {
  const staticData = useStaticGameData();
  
  return (
    <StaticGameDataContext.Provider value={staticData}>
      {children}
    </StaticGameDataContext.Provider>
  );
};

export const useStaticGameDataContext = () => {
  const context = useContext(StaticGameDataContext);
  if (!context) {
    throw new Error('useStaticGameDataContext must be used within StaticGameDataProvider');
  }
  return context;
};
