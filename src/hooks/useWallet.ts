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
    console.log('🔵 useWallet: initializing connector');
    
    // Initialize connector
    const nearConnector = new NearConnector({ 
      network: "mainnet"
    });

    setConnector(nearConnector);

    // Set up event listeners
    nearConnector.on("wallet:signIn", async (event) => {
      console.log('🟢 wallet:signIn event received', event);
      
      const wallet = await nearConnector.wallet();
      const accountId = event.accounts[0]?.accountId;
      
      console.log('📄 Setting wallet state:', { accountId, isConnected: true });
      
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
      
      console.log('✅ Wallet connected, navigating to menu');
      
      toast({
        title: "Кошелек подключен",
        description: `Подключен аккаунт: ${accountId}`,
      });
      
      // Navigate directly after successful connection
      setTimeout(() => {
        window.location.href = '/menu';
      }, 500);
    });

    nearConnector.on("wallet:signOut", async () => {
      console.log('🔴 wallet:signOut event received');
      
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
    
    console.log('📂 Checking localStorage:', { isConnected, accountId });
    
    if (isConnected && accountId) {
      console.log('🔄 Restoring wallet state from localStorage');
      setWalletState({
        isConnected: true,
        accountId,
        isConnecting: false
      });
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