import { useState, useEffect, useCallback } from 'react';
import { HotConnector, NearConnector, WalletType } from '@hot-labs/near-connect';
import { TonConnectUI } from '@tonconnect/ui';

export interface WalletConnection {
  type: WalletType;
  address: string;
  balance?: string;
  network?: string;
}

export const useWalletConnection = () => {
  const [connector, setConnector] = useState<HotConnector | null>(null);
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize connectors
  useEffect(() => {
    const initializeConnector = async () => {
      try {
        // Initialize NEAR connector
        const nearConnector = new NearConnector({
          network: 'mainnet',
          features: {
            signMessage: true,
            signTransaction: true,
          }
        });

        // Initialize TON connector with error handling
        let tonConnect;
        try {
          tonConnect = new TonConnectUI({
            manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
            buttonRootId: 'ton-connect'
          });
        } catch (tonError) {
          console.warn('TON Connect initialization failed:', tonError);
          // Continue without TON support if it fails
        }

        // Create HOT connector following documentation pattern
        const hotConnector = new HotConnector({
          chains: tonConnect ? [WalletType.NEAR, WalletType.TON] : [WalletType.NEAR],
          nearConnector,
          ...(tonConnect && { tonConnect }),
          
          onConnect: async (wallet: any) => {
            const address = await wallet.getAddress();
            const type = wallet.type;
            handleWalletConnect({ address }, type);
          },

          onDisconnect: (type: WalletType) => {
            handleWalletDisconnect(type);
          }
        });

        setConnector(hotConnector);
      } catch (err) {
        setError('Failed to initialize wallet connector');
        console.error('Wallet connector initialization error:', err);
      }
    };

    initializeConnector();
  }, []);

  const handleWalletConnect = useCallback(async (wallet: any, type: WalletType) => {
    try {
      let address = wallet.address || '';
      let balance = '';
      let network = '';

      switch (type) {
        case WalletType.NEAR:
          network = 'NEAR';
          break;
        case WalletType.TON:
          network = 'TON';
          break;
      }

      const newConnection: WalletConnection = {
        type,
        address,
        balance,
        network
      };

      setConnections(prev => {
        const filtered = prev.filter(conn => conn.type !== type);
        return [...filtered, newConnection];
      });

      setError(null);
    } catch (err) {
      setError(`Failed to connect ${type} wallet`);
      console.error('Wallet connection error:', err);
    }
  }, []);

  const handleWalletDisconnect = useCallback((type: WalletType) => {
    setConnections(prev => prev.filter(conn => conn.type !== type));
  }, []);

  const connectWallet = useCallback(async (walletType: WalletType) => {
    if (!connector) {
      setError('Wallet connector not initialized');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await connector.connect();
    } catch (err) {
      setError(`Failed to connect ${walletType} wallet`);
      console.error('Connect wallet error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [connector]);

  const disconnectWallet = useCallback(async (walletType: WalletType) => {
    if (!connector) return;

    try {
      await connector.disconnect(walletType);
    } catch (err) {
      setError(`Failed to disconnect ${walletType} wallet`);
      console.error('Disconnect wallet error:', err);
    }
  }, [connector]);

  const disconnectAll = useCallback(async () => {
    if (!connector) return;

    try {
      // Disconnect each wallet type individually
      for (const connection of connections) {
        await connector.disconnect(connection.type);
      }
      setConnections([]);
    } catch (err) {
      setError('Failed to disconnect all wallets');
      console.error('Disconnect all error:', err);
    }
  }, [connector, connections]);

  return {
    connections,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    disconnectAll,
    isInitialized: !!connector
  };
};