import React, { createContext, useContext, ReactNode, useRef } from 'react';
import { useItemInstances, ItemInstance } from '@/hooks/useItemInstances';

interface ItemInstancesContextType {
  instances: ItemInstance[];
  loading: boolean;
  refetch: () => Promise<any>;
  addItemInstances: ReturnType<typeof useItemInstances>['addItemInstances'];
  removeItemInstancesByIds: ReturnType<typeof useItemInstances>['removeItemInstancesByIds'];
  getCountsByItemId: ReturnType<typeof useItemInstances>['getCountsByItemId'];
  getInstancesByItemId: ReturnType<typeof useItemInstances>['getInstancesByItemId'];
}

const ItemInstancesContext = createContext<ItemInstancesContextType | undefined>(undefined);

const DEV = import.meta.env.DEV;

export const ItemInstancesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const loggedOnce = useRef(false);
  if (DEV && !loggedOnce.current) {
    loggedOnce.current = true;
    console.log('🔄 [ItemInstancesProvider] mount');
  }
  const itemInstancesData = useItemInstances();

  return (
    <ItemInstancesContext.Provider value={itemInstancesData}>
      {children}
    </ItemInstancesContext.Provider>
  );
};

export const useItemInstancesContext = () => {
  const context = useContext(ItemInstancesContext);
  if (context === undefined) {
    throw new Error('useItemInstancesContext must be used within an ItemInstancesProvider');
  }
  return context;
};
