import { useState, useEffect, useCallback } from 'react';
import { NearConnector } from '@hot-labs/near-connect';
import { useToast } from '@/hooks/use-toast';

interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  isConnecting: boolean;
}

export const useWallet = () => {
  const { toast } = useToast();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    accountId: null,
    isConnecting: false
  });
  const [connector, setConnector] = useState<NearConnector | null>(null);

  useEffect(() => {
    // Initialize connector (singleton on window)
    const w = window as any;
    if (!w.__nearConnector) {
      w.__nearConnector = new NearConnector({ 
        network: "mainnet"
      });
    }
    const nearConnector = w.__nearConnector as NearConnector;

    setConnector(nearConnector);

    // Listen for global wallet state updates to sync all hook instances
    const onGlobalWalletState = (e: any) => {
      const detail = e.detail || {};
      setWalletState({
        isConnected: !!detail.isConnected,
        accountId: detail.accountId ?? null,
        isConnecting: !!detail.isConnecting
      });
    };
    window.addEventListener('near-wallet:state', onGlobalWalletState);

    // Prepare single-attachment flag for connector listeners
    const shouldAttachListeners = !w.__nearConnectorListenersAttached;
    if (!w.__nearConnectorListenersAttached) {
      w.__nearConnectorListenersAttached = true;
    }

    // Set up event listeners
    if (shouldAttachListeners) nearConnector.on("wallet:signIn", async (event) => {
      const wallet = await nearConnector.wallet();
      const accountId = event.accounts[0]?.accountId;
      
      // Broadcast to all instances
      window.dispatchEvent(new CustomEvent('near-wallet:state', { detail: { isConnected: true, accountId, isConnecting: false } }));
      
      setWalletState({
        isConnected: true,
        accountId,
        isConnecting: false
      });
      
      // Clear previous wallet data from localStorage
      localStorage.removeItem('game-storage');
      
      // Save to localStorage for persistence
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAccountId', accountId || '');
      
      toast({
        title: "Кошелек подключен",
        description: `Подключен аккаунт: ${accountId}`,
      });
    });

    if (shouldAttachListeners) nearConnector.on("wallet:signOut", async () => {
      // Broadcast to all instances
      window.dispatchEvent(new CustomEvent('near-wallet:state', { detail: { isConnected: false, accountId: null, isConnecting: false } }));

      setWalletState({
        isConnected: false,
        accountId: null,
        isConnecting: false
      });
      
      // Clear all localStorage data
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAccountId');
      localStorage.removeItem('game-storage');
      
      toast({
        title: "Кошелек отключен",
        description: "Вы успешно отключили кошелек",
      });
    });

    // Check for existing connection
    const isConnected = localStorage.getItem('walletConnected') === 'true';
    const accountId = localStorage.getItem('walletAccountId');
    
    if (isConnected && accountId) {
      setWalletState({
        isConnected: true,
        accountId,
        isConnecting: false
      });
    }

    return () => {
      // Cleanup global listener
      window.removeEventListener('near-wallet:state', onGlobalWalletState);
    };
  }, [toast]);

  const connectWallet = useCallback(async () => {
    if (!connector) return;
    
    setWalletState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      // According to docs, we need to trigger the connector which will show modal
      // The signIn event will be triggered when user successfully connects
      await connector.connect();
    } catch (error) {
      console.error('Wallet connection error:', error);
      setWalletState(prev => ({ ...prev, isConnecting: false }));
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключить кошелек",
        variant: "destructive"
      });
    }
  }, [connector, toast]);

  const disconnectWallet = useCallback(async () => {
    if (!connector) return;
    
    try {
      const wallet = await connector.wallet();
      if (wallet) {
        await wallet.signOut();
      }
    } catch (error) {
      console.error('Wallet disconnect error:', error);
      // Force disconnect on error
      setWalletState({
        isConnected: false,
        accountId: null,
        isConnecting: false
      });
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAccountId');
    }
  }, [connector]);

  const getWallet = useCallback(async () => {
    if (!connector || !walletState.isConnected) return null;
    return await connector.wallet();
  }, [connector, walletState.isConnected]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    getWallet
  };
};