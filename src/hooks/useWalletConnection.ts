import { useState, useEffect, useCallback } from 'react';
import { HotConnector } from '@hot-labs/near-connect';
import { NearConnector } from '@hot-labs/near-connect';
import { TonConnectUI } from '@tonconnect/ui';
import { WalletType, ConnectedWallets } from '@hot-labs/near-connect';

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

        // Initialize TON connector
        const tonConnect = new TonConnectUI({
          manifestUrl: `${window.location.origin}/tonconnect-manifest.json`
        });

        // Create simplified HOT connector with basic wallet types
        const hotConnector = new HotConnector({
          chains: [WalletType.NEAR, WalletType.TON],
          nearConnector,
          tonConnect,
          onConnect: <T extends WalletType>(wallet: ConnectedWallets[T], type: T) => {
            handleWalletConnect(wallet, type);
          },
          onDisconnect: <T extends WalletType>(type: T) => {
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
      let address = '';
      let balance = '';
      let network = '';

      switch (type) {
        case WalletType.NEAR:
          address = wallet.accountId || '';
          network = 'NEAR';
          break;
        case WalletType.EVM:
          address = wallet.address || '';
          network = 'Ethereum';
          break;
        case WalletType.SOLANA:
          address = wallet.publicKey?.toString() || '';
          network = 'Solana';
          break;
        case WalletType.TON:
          address = wallet.account?.address || '';
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