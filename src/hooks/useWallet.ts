import { useState, useEffect, useCallback } from 'react';
import { NearConnector } from '@hot-labs/near-connect';
import { useToast } from '@/hooks/use-toast';

// Singleton NearConnector to avoid re-initialization across mounts
let singletonConnector: NearConnector | null = null;
let listenersRegistered = false;

const getNearConnector = () => {
  if (!singletonConnector) {
    singletonConnector = new NearConnector({ network: 'mainnet' });
  }
  return singletonConnector;
};

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
    console.log('🔵 useWallet: initializing connector');

    // Mark as initializing to prevent premature redirects
    setWalletState((prev) => ({ ...prev, isConnecting: true }));

    // Initialize or get singleton connector
    const nearConnector = getNearConnector();
    setConnector(nearConnector);

    // Set up event listeners once
    if (!listenersRegistered) {
      listenersRegistered = true;

      nearConnector.on('wallet:signIn', async (event) => {
        console.log('🟢 wallet:signIn event received', event);
        const accountId = event.accounts[0]?.accountId;

        console.log('📄 Setting wallet state:', { accountId, isConnected: true });
        setWalletState({ isConnected: true, accountId, isConnecting: false });

        // Reset previous game cache
        localStorage.removeItem('game-storage');

        // Persist wallet connection
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAccountId', accountId || '');

        console.log('✅ Wallet connected, navigating to menu');
        toast({ title: 'Кошелек подключен', description: `Подключен аккаунт: ${accountId}` });

        // Force full reload and navigate
        setTimeout(() => {
          window.location.replace('/menu');
        }, 300);
      });

      nearConnector.on('wallet:signOut', async () => {
        console.log('🔴 wallet:signOut event received');

        setWalletState({ isConnected: false, accountId: null, isConnecting: false });

        // Clear persisted data
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAccountId');
        localStorage.removeItem('game-storage');

        toast({ title: 'Кошелек отключен', description: 'Вы успешно отключили кошелек' });

        // Force full reload to auth
        setTimeout(() => {
          window.location.replace('/auth');
        }, 300);
      });
    }

    // Check for existing connection
    const isConnected = localStorage.getItem('walletConnected') === 'true';
    const accountId = localStorage.getItem('walletAccountId');

    console.log('📂 Checking localStorage:', { isConnected, accountId });

    if (isConnected && accountId) {
      console.log('🔄 Restoring wallet state from localStorage');
      setWalletState({ isConnected: true, accountId, isConnecting: false });
    } else {
      // Finish initializing
      setWalletState((prev) => ({ ...prev, isConnecting: false }));
    }

    return () => {
      console.log('🧹 useWallet cleanup');
    };
  }, [toast]);

  const connectWallet = useCallback(async () => {
    console.log('🎯 connectWallet called');
    
    if (!connector) {
      console.log('❌ No connector available');
      return;
    }
    
    console.log('⏳ Setting isConnecting to true');
    setWalletState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      console.log('🚀 Calling connector.connect()');
      await connector.connect();
      console.log('✅ connector.connect() completed');
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      setWalletState(prev => ({ ...prev, isConnecting: false }));
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключить кошелек",
        variant: "destructive"
      });
    }
  }, [connector, toast]);

  const disconnectWallet = useCallback(async () => {
    try {
      // Immediately update state to prevent multiple clicks
      setWalletState({
        isConnected: false,
        accountId: null,
        isConnecting: false
      });
      
      // Clear localStorage immediately
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAccountId');
      
      // Then try to sign out from wallet
      if (connector) {
        const wallet = await connector.wallet();
        if (wallet) {
          await wallet.signOut();
        }
      }
      
      // Force navigation after a short delay
      setTimeout(() => {
        window.location.replace('/auth');
      }, 100);
      
    } catch (error) {
      console.error('Wallet disconnect error:', error);
      // Force redirect even on error
      window.location.replace('/auth');
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