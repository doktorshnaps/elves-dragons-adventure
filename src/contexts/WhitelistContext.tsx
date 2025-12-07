import React, { createContext, useContext, ReactNode } from 'react';

interface WhitelistContextType {
  isWhitelisted: boolean;
  loading: boolean;
}

const WhitelistContext = createContext<WhitelistContextType | undefined>(undefined);

// Whitelist is no longer used - game is open access
// This context is kept for backward compatibility but always returns true
export const WhitelistProvider = ({ children }: { children: ReactNode }) => {
  return (
    <WhitelistContext.Provider value={{ isWhitelisted: true, loading: false }}>
      {children}
    </WhitelistContext.Provider>
  );
};

export const useWhitelistContext = () => {
  const context = useContext(WhitelistContext);
  if (context === undefined) {
    throw new Error('useWhitelistContext must be used within WhitelistProvider');
  }
  return context;
};
