import React, { createContext, useContext, ReactNode, useRef } from 'react';
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

const DEV = import.meta.env.DEV;

export const CardInstancesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Single mount-log only in DEV. The hook itself has its own init guards now.
  const loggedOnce = useRef(false);
  if (DEV && !loggedOnce.current) {
    loggedOnce.current = true;
    console.log('🔄 [CardInstancesProvider] mount');
  }
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
