/**
 * Example 2: OMNI with React Context
 * 
 * Shows how to create a React context for OMNI state management.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  initOmniConnector,
  getOmniConnector,
  getConnectedWallets,
  onWalletConnect,
  onWalletDisconnect,
  connectOmniWallet,
  type OmniWallet,
  type HotConnector,
} from '@/lib/web3';

interface OmniContextType {
  connector: HotConnector | null;
  wallets: OmniWallet[];
  primaryWallet: OmniWallet | null;
  isInitialized: boolean;
  isConnecting: boolean;
  connect: (chain?: 'near' | 'evm') => Promise<void>;
  disconnect: (wallet?: OmniWallet) => Promise<void>;
}

const OmniContext = createContext<OmniContextType>({
  connector: null,
  wallets: [],
  primaryWallet: null,
  isInitialized: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
});

export function OmniProvider({ children }: { children: ReactNode }) {
  const [connector, setConnector] = useState<HotConnector | null>(null);
  const [wallets, setWallets] = useState<OmniWallet[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const conn = await initOmniConnector({
          enabledChains: ['near', 'evm'],
        });
        setConnector(conn);
        setWallets(getConnectedWallets());
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize OMNI:', error);
        setIsInitialized(true); // Still mark as initialized to prevent infinite loading
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const unsubConnect = onWalletConnect(() => {
      setWallets(getConnectedWallets());
    });

    const unsubDisconnect = onWalletDisconnect(() => {
      setWallets(getConnectedWallets());
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, [isInitialized]);

  const connect = async (chain?: 'near' | 'evm') => {
    setIsConnecting(true);
    try {
      await connectOmniWallet(chain);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async (wallet?: OmniWallet) => {
    const target = wallet || wallets[0];
    if (target) {
      await target.disconnect();
      setWallets(getConnectedWallets());
    }
  };

  return (
    <OmniContext.Provider
      value={{
        connector,
        wallets,
        primaryWallet: wallets[0] || null,
        isInitialized,
        isConnecting,
        connect,
        disconnect,
      }}
    >
      {children}
    </OmniContext.Provider>
  );
}

export function useOmni() {
  const context = useContext(OmniContext);
  if (!context) {
    throw new Error('useOmni must be used within OmniProvider');
  }
  return context;
}

// Example component using the context
export function OmniWithContextExample() {
  const { wallets, primaryWallet, isInitialized, isConnecting, connect, disconnect } = useOmni();

  if (!isInitialized) {
    return <div>Loading OMNI...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">OMNI Context Example</h2>
      
      {primaryWallet ? (
        <div className="space-y-2">
          <p>Connected: {primaryWallet.address}</p>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-x-2">
          <button
            onClick={() => connect('near')}
            disabled={isConnecting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            {isConnecting ? 'Connecting...' : 'Connect NEAR'}
          </button>
          <button
            onClick={() => connect('evm')}
            disabled={isConnecting}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
          >
            {isConnecting ? 'Connecting...' : 'Connect EVM'}
          </button>
        </div>
      )}
    </div>
  );
}

export default OmniWithContextExample;
