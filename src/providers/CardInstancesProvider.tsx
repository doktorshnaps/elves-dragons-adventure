import React, { createContext, useContext, ReactNode } from 'react';
import { useCardInstances, CardInstance } from '@/hooks/useCardInstances';

interface CardInstancesContextType {
  cardInstances: CardInstance[];
  loading: boolean;
  createCardInstance: ReturnType<typeof useCardInstances>['createCardInstance'];
  updateCardHealth: ReturnType<typeof useCardInstances>['updateCardHealth'];
  applyDamageToInstance: ReturnType<typeof useCardInstances>['applyDamageToInstance'];
  deleteCardInstance: ReturnType<typeof useCardInstances>['deleteCardInstance'];
  deleteCardInstanceByTemplate: ReturnType<typeof useCardInstances>['deleteCardInstanceByTemplate'];
  incrementMonsterKills: ReturnType<typeof useCardInstances>['incrementMonsterKills'];
  loadCardInstances: () => void;
}

const CardInstancesContext = createContext<CardInstancesContextType | undefined>(undefined);

export const CardInstancesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const cardInstancesData = useCardInstances();

  return (
    <CardInstancesContext.Provider value={cardInstancesData}>
      {children}
    </CardInstancesContext.Provider>
  );
};

export const useCardInstancesContext = () => {
  const context = useContext(CardInstancesContext);
  if (context === undefined) {
    throw new Error('useCardInstancesContext must be used within a CardInstancesProvider');
  }
  return context;
};
