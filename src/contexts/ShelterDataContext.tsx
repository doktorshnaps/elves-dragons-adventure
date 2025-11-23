import React, { createContext, useContext, ReactNode } from 'react';
import { useUnifiedGameState } from '@/hooks/useUnifiedGameState';
import { useCardInstances } from '@/hooks/useCardInstances';

interface ShelterDataContextType {
  gameState: ReturnType<typeof useUnifiedGameState>;
  cardInstances: ReturnType<typeof useCardInstances>['cardInstances'];
  loadCardInstances: ReturnType<typeof useCardInstances>['loadCardInstances'];
  deleteCardInstance: ReturnType<typeof useCardInstances>['deleteCardInstance'];
}

const ShelterDataContext = createContext<ShelterDataContextType | undefined>(undefined);

export const ShelterDataProvider = ({ children }: { children: ReactNode }) => {
  // Единственный экземпляр useUnifiedGameState для всей страницы Shelter
  const gameState = useUnifiedGameState();
  const { cardInstances, loadCardInstances, deleteCardInstance } = useCardInstances();

  const value: ShelterDataContextType = {
    gameState,
    cardInstances,
    loadCardInstances,
    deleteCardInstance
  };

  return (
    <ShelterDataContext.Provider value={value}>
      {children}
    </ShelterDataContext.Provider>
  );
};

export const useShelterData = () => {
  const context = useContext(ShelterDataContext);
  if (!context) {
    throw new Error('useShelterData must be used within ShelterDataProvider');
  }
  return context;
};
