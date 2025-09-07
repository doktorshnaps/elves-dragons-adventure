import { useState, useEffect, useCallback } from 'react';
import { NearConnector } from '@hot-labs/near-connect';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useNFTCards } from './useNFTCards';

// Singleton NearConnector to avoid re-initialization across mounts
let singletonConnector: NearConnector | null = null;
let listenersRegistered = false;

// Detect if running in Telegram WebApp
const isTelegramWebApp = () => {
  return typeof window !== 'undefined' && 
         (window as any).Telegram && 
         (window as any).Telegram.WebApp;
};

const getNearConnector = () => {
  if (!singletonConnector) {
    const config: any = { network: 'mainnet' };
    
    // If running in Telegram, configure for Telegram environment
    if (isTelegramWebApp()) {
      config.options = {
        telegramWebApp: true,
        onWalletRedirect: (url: string) => {
          try {
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
              const tg = (window as any).Telegram.WebApp;
              // If the wallet wants to open a Telegram link/deeplink, open it via Telegram API
              if (/^(https?:\/\/)?t\.me\//i.test(url) || /^tg:\/\//i.test(url)) {
                tg.openTelegramLink(url);
                return false; // Prevent default redirect (handled by Telegram)
              }
              // Heuristics for HOT/Here wallet inside Telegram
              if (url.includes('hot_wallet') || url.includes('hot-labs') || url.includes('herewallet')) {
                tg.openTelegramLink('https://t.me/hot_wallet/app');
                return false;
              }
            }
          } catch (e) {
            console.warn('Telegram link open failed, falling back', e);
          }

          // Fallback for browsers: open Telegram links in a new tab
          if (/^(https?:\/\/)?t\.me\//i.test(url)) {
            window.open(url, '_blank');
            return false;
          }
          return true; // Allow default redirect for other wallets
        }
      };
    }
    
    singletonConnector = new NearConnector(config);
  }
  return singletonConnector;
};

interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  isConnecting: boolean;
}

// Helper function to save wallet connection data to Supabase
const saveWalletConnection = async (walletAddress: string, isConnecting: boolean) => {
  try {
    // Get or create stable identity for this wallet
    const { data: identityId, error: identityError } = await supabase
      .rpc('get_or_create_wallet_identity', { p_wallet_address: walletAddress });
    
    if (identityError) {
      console.error('Failed to get wallet identity:', identityError);
      return;
    }

    if (isConnecting) {
      // Mark any existing active connections as inactive first
      await supabase
        .from('wallet_connections')
        .update({ 
          is_active: false, 
          disconnected_at: new Date().toISOString() 
        })
        .eq('wallet_address', walletAddress)
        .eq('is_active', true);

      // Create new connection record with stable identity_id
      await supabase
        .from('wallet_connections')
        .insert({
          wallet_address: walletAddress,
          identity_id: identityId,
          is_active: true,
          user_agent: navigator.userAgent,
          connected_at: new Date().toISOString()
        });
    } else {
      // Mark current connection as disconnected
      await supabase
        .from('wallet_connections')
        .update({ 
          is_active: false, 
          disconnected_at: new Date().toISOString() 
        })
        .eq('wallet_address', walletAddress)
        .eq('is_active', true);
    }
  } catch (error) {
    console.error('Failed to save wallet connection data:', error);
  }
};

export const useWallet = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { syncNFTCards } = useNFTCards();
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

        // Save wallet connection to Supabase
        if (accountId) {
          await saveWalletConnection(accountId, true);
          
          // Sync NFT cards from wallet
          try {
            console.log('🎮 Syncing NFT cards for wallet:', accountId);
            await syncNFTCards(accountId);
          } catch (error) {
            console.error('Error syncing NFT cards:', error);
          }
        }

        console.log('✅ Wallet connected, navigating to menu');
        toast({ title: 'Кошелек подключен', description: `Подключен аккаунт: ${accountId}` });

        // Smooth navigation without full reload
        navigate('/menu', { replace: true });
      });

      nearConnector.on('wallet:signOut', async () => {
        console.log('🔴 wallet:signOut event received');
        
        const currentAccountId = localStorage.getItem('walletAccountId');

        setWalletState({ isConnected: false, accountId: null, isConnecting: false });

        // Save wallet disconnection to Supabase
        if (currentAccountId) {
          await saveWalletConnection(currentAccountId, false);
        }

        // Clear persisted data
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAccountId');
        localStorage.removeItem('game-storage');

        toast({ title: 'Кошелек отключен', description: 'Вы успешно отключили кошелек' });

        // Smooth navigation without full reload
        navigate('/auth', { replace: true });
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
      const currentAccountId = walletState.accountId;
      
      // Immediately update state to prevent multiple clicks
      setWalletState({
        isConnected: false,
        accountId: null,
        isConnecting: false
      });
      
      // Save wallet disconnection to Supabase
      if (currentAccountId) {
        await saveWalletConnection(currentAccountId, false);
      }
      
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
      
      // Smooth navigation without full reload
      navigate('/auth', { replace: true });
      
    } catch (error) {
      console.error('Wallet disconnect error:', error);
      // Navigate even on error
      navigate('/auth', { replace: true });
    }
  }, [connector, walletState.accountId]);

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