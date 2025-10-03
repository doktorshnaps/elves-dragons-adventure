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

// Temporary workaround for non-clickable buttons in HOT Wallet modal on mobile/Telegram
// - Observes DOM for buttons labeled "Open Mobile" / "Open Telegram"
// - Ensures their containers allow pointer events and auto-clicks the right one
const setupHotModalAutoClick = () => {
  try {
    const isTg = isTelegramWebApp();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isTg && !isMobile) return undefined; // Only needed on mobile/Telegram

    let stopped = false;
    const startedAt = Date.now();

    const ensureInteractive = (el: HTMLElement | null) => {
      if (!el) return;
      // Walk up and re-enable pointer events on ancestors just in case
      let p: HTMLElement | null = el;
      let hops = 0;
      while (p && p !== document.body && hops < 8) {
        if (getComputedStyle(p).pointerEvents === 'none') {
          try { p.style.setProperty('pointer-events', 'auto', 'important'); } catch { p.style.pointerEvents = 'auto'; }
        }
        // Also bump z-index aggressively if overlay-like
        if (getComputedStyle(p).position === 'fixed' || getComputedStyle(p).position === 'absolute') {
          const z = parseInt(getComputedStyle(p).zIndex || '0', 10);
          if (!Number.isNaN(z) && z < 2147483647) {
            try { p.style.setProperty('z-index', '2147483647', 'important'); } catch { (p as any).style.zIndex = '2147483647'; }
          }
        }
        p = p.parentElement;
        hops++;
      }
    };

    const tryClick = () => {
      if (stopped) return false;

      // 1) Boost common provider iframes (HOT/Here/NEAR) so they can capture touches
      const iframes = Array.from(document.querySelectorAll('iframe')) as HTMLIFrameElement[];
      for (const f of iframes) {
        const src = (f.getAttribute('src') || '').toLowerCase();
        if (/hot|here|near|wallet/.test(src)) {
          ensureInteractive(f as unknown as HTMLElement);
        }
      }

      // 2) Try to find provider action buttons in the DOM (non-iframe case)
      const nodes = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      let mobileBtn: HTMLElement | undefined;
      let tgBtn: HTMLElement | undefined;
      for (const n of nodes) {
        const text = (n.textContent || '').trim().toLowerCase();
        if (!text) continue;
        if (text.includes('open mobile')) mobileBtn = n;
        if (text.includes('open telegram')) tgBtn = n;
      }

      if (isTg && tgBtn) {
        console.log('🛠 Auto-click: Open Telegram');
        ensureInteractive(tgBtn);
        tgBtn.click();
        return true;
      }
      if (!isTg && isMobile && mobileBtn) {
        console.log('🛠 Auto-click: Open Mobile');
        ensureInteractive(mobileBtn);
        mobileBtn.click();
        return true;
      }
      return false;
    };

    // Run immediately in case modal already present
    tryClick();

    const observer = new MutationObserver(() => {
      if (tryClick()) {
        // After successful click, we can stop shortly after
        setTimeout(() => stop(), 500);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = setInterval(() => {
      // Safety timeout: stop trying after 15s
      if (Date.now() - startedAt > 15000) stop();
      else tryClick();
    }, 400);

    const stop = () => {
      if (stopped) return;
      stopped = true;
      observer.disconnect();
      clearInterval(interval);
    };

    return stop;
  } catch (e) {
    console.warn('setupHotModalAutoClick failed:', e);
    return undefined;
  }
};

const getNearConnector = () => {
  if (!singletonConnector) {
    const config: any = { 
      network: 'mainnet',
      options: {
        // Enable mobile support for touch events
        mobileSupport: true,
        // Handle wallet redirects for mobile and Telegram
        onWalletRedirect: (url: string) => {
          console.log('🔗 Wallet redirect requested:', url);
          
          try {
            // Check if running in Telegram WebApp
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
              const tg = (window as any).Telegram.WebApp;
              
              // Handle Telegram links/deeplinks
              if (/^(https?:\/\/)?t\.me\//i.test(url) || /^tg:\/\//i.test(url)) {
                console.log('📱 Opening Telegram link:', url);
                tg.openTelegramLink(url);
                return false; // Prevent default redirect
              }
              
              // Handle HOT/Here wallet links in Telegram
              if (url.includes('hot_wallet') || url.includes('hot-labs') || url.includes('herewallet')) {
                console.log('📱 Opening HOT Wallet in Telegram');
                tg.openTelegramLink('https://t.me/hot_wallet/app');
                return false;
              }
            }
            
            // For mobile browsers, handle wallet app deep links
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
              // Handle HOT Wallet mobile app
              if (url.includes('hot_wallet') || url.includes('hot-labs') || url.includes('herewallet')) {
                console.log('📱 Opening HOT Wallet mobile app');
                window.location.href = url;
                return false;
              }
              
              // Handle Telegram bot links on mobile
              if (/^(https?:\/\/)?t\.me\//i.test(url)) {
                console.log('📱 Opening Telegram link on mobile');
                window.location.href = url;
                return false;
              }
            }
          } catch (e) {
            console.warn('❌ Wallet redirect handling failed:', e);
          }

          // Fallback: open in new tab for desktop browsers
          if (/^(https?:\/\/)?t\.me\//i.test(url)) {
            console.log('🖥️ Opening Telegram link in new tab');
            window.open(url, '_blank', 'noopener,noreferrer');
            return false;
          }
          
          return true; // Allow default redirect for other cases
        }
      }
    };
    
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

      nearConnector.on('wallet:signIn', (event) => {
        console.log('🟢 wallet:signIn event received', event);
        const accountId = event.accounts[0]?.accountId;

        console.log('📄 Setting wallet state:', { accountId, isConnected: true });
        setWalletState({ isConnected: true, accountId, isConnecting: false });
        try { document.body.classList.remove('wallet-modal-open'); } catch {}

        // Reset previous game cache
        localStorage.removeItem('game-storage');

        // Persist wallet connection
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAccountId', accountId || '');

        console.log('✅ Wallet connected, processing authentication...');
        toast({ title: 'Кошелек подключен', description: `Подключен аккаунт: ${accountId}` });

        // Defer Supabase operations to prevent deadlock
        if (accountId) {
          setTimeout(async () => {
            try {
              // Save wallet connection to Supabase
              await saveWalletConnection(accountId, true);

              // Ensure game_data record exists for this wallet (with 0 balance if new)
              console.log('🎮 Ensuring game_data exists for wallet:', accountId);
              await supabase.rpc('ensure_game_data_exists', {
                p_wallet_address: accountId
              });

              // Authenticate this wallet with Supabase (creates/links user + profile)
              await supabase.rpc('authenticate_wallet_session', {
                p_wallet_address: accountId,
                p_signature: '',
                p_message: ''
              });

              // Sign in using deterministic email/password set by RPC
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: `${accountId}@wallet.local`,
                password: 'wallet-auth'
              });
              if (signInError) {
                console.error('Supabase auth sign-in error:', signInError);
              } else if (signInData?.user) {
                // Ensure game_data row is linked to this auth user
                await supabase
                  .from('game_data')
                  .update({ user_id: signInData.user.id })
                  .eq('wallet_address', accountId);
              }

              // Sync NFT cards from wallet
              console.log('🎮 Syncing NFT cards for wallet:', accountId);
              await syncNFTCards(accountId);

              // Check NFT whitelist
              try {
                console.log('🔍 Checking NFT whitelist for:', accountId);
                const { data, error } = await supabase.functions.invoke('check-nft-whitelist', {
                  body: { wallet_address: accountId }
                });
                
                if (error) {
                  console.log('⚠️ NFT whitelist check failed:', error);
                } else if (data?.addedToWhitelist) {
                  console.log('✅ Added to whitelist via NFT ownership');
                }
              } catch (whitelistError) {
                console.log('⚠️ NFT whitelist check failed (non-critical):', whitelistError);
              }

              // Notify app about wallet change so data can be reloaded
              window.dispatchEvent(new CustomEvent('wallet-changed', { detail: { walletAddress: accountId } }));

              console.log('🔄 Authentication complete, navigating to menu');
              // Smooth navigation without full reload
              navigate('/menu', { replace: true });
            } catch (error) {
              console.error('Wallet authentication error:', error);
              // Still navigate to menu even if auth fails
              navigate('/menu', { replace: true });
            }
          }, 0);
        }
      });

      nearConnector.on('wallet:signOut', async () => {
        console.log('🔴 wallet:signOut event received');
        
        const currentAccountId = localStorage.getItem('walletAccountId');

        setWalletState({ isConnected: false, accountId: null, isConnecting: false });
        try { document.body.classList.remove('wallet-modal-open'); } catch {}
        
        // Save wallet disconnection to Supabase
        if (currentAccountId) {
          await saveWalletConnection(currentAccountId, false);
        }

        // Sign out from Supabase auth
        try { await supabase.auth.signOut(); } catch (e) { console.warn('Supabase signOut error', e); }

        // Clear persisted data
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAccountId');
        localStorage.removeItem('game-storage');
        localStorage.removeItem('gameCards');
        localStorage.removeItem('gameBalance');
        localStorage.removeItem('gameInventory');

        toast({ title: 'Кошелек отключен', description: 'Вы успешно отключили кошелек' });

        // Notify app that wallet disconnected
        window.dispatchEvent(new Event('wallet-disconnected'));

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

    // While wallet modal is open, let it receive all pointer events
    try { document.body.classList.add('wallet-modal-open'); } catch {}
    
    // Workaround: ensure HOT modal buttons are interactive on mobile/Telegram
    const stopAutoClick = setupHotModalAutoClick?.();
    
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
      try { document.body.classList.remove('wallet-modal-open'); } catch {}
    } finally {
      // Cleanup observer/timers if any
      try { stopAutoClick && stopAutoClick(); } catch {}
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
      localStorage.removeItem('gameCards');
      
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