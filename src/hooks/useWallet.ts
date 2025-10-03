import { useState, useEffect, useCallback } from 'react';
import { NearConnector } from '@hot-labs/near-connect';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useNFTCards } from './useNFTCards';

// Singleton NearConnector to avoid re-initialization across mounts
let singletonConnector: NearConnector | null = null;
let listenersRegistered = false;

// 1) Детект окружения
const isTelegramWebApp = () =>
  typeof window !== 'undefined' && (window as any).Telegram?.WebApp;

const isMobileDevice = (): boolean =>
  ('ontouchstart' in window) ||
  (navigator.maxTouchPoints > 0) ||
  ((navigator as any).msMaxTouchPoints > 0) ||
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// 2) Fallback-открытие внешних ссылок в WebView/Telegram
const openExternalLink = (url: string) => {
  const inTg = isTelegramWebApp();
  if (inTg) {
    const tg = (window as any).Telegram.WebApp;
    if (/^tg:\/\//i.test(url) || /t\.me\//i.test(url)) {
      tg.openTelegramLink(url);
      return;
    }
    tg.openLink(url, { try_instant_view: false });
    return;
  }

  const embedded = window.location !== window.parent.location;
  if (embedded) {
    try {
      window.parent.postMessage({ type: 'OPEN_EXTERNAL_LINK', url }, '*');
      return;
    } catch { /* ignore */ }
  }

  // Мобильный fallback — безопасная ссылка в новый таб
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 3) Обеспечение кликабельности на мобилках
const ensureInteractive = (el: HTMLElement | null) => {
  if (!el) return;
  let p: HTMLElement | null = el;
  let hops = 0;
  while (p && p !== document.body && hops < 12) {
    const cs = getComputedStyle(p);
    if (cs.pointerEvents === 'none') {
      try { p.style.setProperty('pointer-events', 'auto', 'important'); }
      catch { p.style.pointerEvents = 'auto'; }
    }
    if (['fixed', 'absolute', 'sticky'].includes(cs.position)) {
      const z = parseInt(cs.zIndex || '0', 10);
      if (Number.isNaN(z) || z < 2147483647) {
        try { p.style.setProperty('z-index', '2147483647', 'important'); }
        catch { p.style.zIndex = '2147483647'; }
      }
    }
    p = p.parentElement;
    hops++;
  }
};

const makeMobileFriendly = (el: HTMLElement) => {
  el.style.touchAction = 'manipulation';
  el.style.setProperty('-webkit-touch-callout', 'none');
  el.style.setProperty('-webkit-user-select', 'none');
  el.style.setProperty('user-select', 'none');
  el.style.cursor = 'pointer';

  const fireClick = () =>
    requestAnimationFrame(() => setTimeout(() => el.click(), 60));

  el.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: false });
  el.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fireClick();
  }, { passive: false });
};

// 4) Глобальные стили для модалки
const injectMobileModalStyles = () => {
  if (document.getElementById('mobile-wallet-styles')) return;
  const style = document.createElement('style');
  style.id = 'mobile-wallet-styles';
  style.textContent = `
    .wallet-modal-open * { pointer-events: auto !important; }
    @media (max-width: 768px) {
      [class*="modal"], [class*="popup"] {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        touch-action: manipulation !important;
        -webkit-overflow-scrolling: touch !important;
      }
      iframe { touch-action: manipulation !important; }
      button, [role="button"], a {
        min-height: 48px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
    }
  `;
  document.head.appendChild(style);
};

// 5) Автоклик для HOT Wallet кнопок
const setupHotModalAutoClick = () => {
  try {
    const isTg = isTelegramWebApp();
    const isMobile = isMobileDevice();
    if (!isTg && !isMobile) return undefined;

    let stopped = false;
    const startedAt = Date.now();

    const tryClick = () => {
      if (stopped) return false;

      // Boost iframes
      const iframes = Array.from(document.querySelectorAll('iframe')) as HTMLIFrameElement[];
      for (const f of iframes) {
        const src = (f.getAttribute('src') || '').toLowerCase();
        if (/hot|here|near|wallet/.test(src)) {
          ensureInteractive(f as unknown as HTMLElement);
        }
      }

      // Find provider buttons
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
        makeMobileFriendly(tgBtn);
        tgBtn.click();
        return true;
      }
      if (!isTg && isMobile && mobileBtn) {
        console.log('🛠 Auto-click: Open Mobile');
        ensureInteractive(mobileBtn);
        makeMobileFriendly(mobileBtn);
        mobileBtn.click();
        return true;
      }
      return false;
    };

    tryClick();

    const observer = new MutationObserver(() => {
      if (tryClick()) {
        setTimeout(() => stop(), 500);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = setInterval(() => {
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

// 6) Singleton NearConnector с улучшенной поддержкой мобильных устройств
const getNearConnector = () => {
  if (!singletonConnector) {
    singletonConnector = new NearConnector({
      network: 'mainnet',
      onWalletRedirect: (url: string) => {
        console.log('🔗 Wallet redirect:', url);
        try {
          openExternalLink(url);
          return false;
        } catch {
          return true;
        }
      }
    } as any);
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
    console.log('🔵 useWallet: initializing');
    injectMobileModalStyles();

    setWalletState((prev) => ({ ...prev, isConnecting: true }));

    const nearConnector = getNearConnector();
    setConnector(nearConnector);

    // Set up event listeners once
    if (!listenersRegistered) {
      listenersRegistered = true;

      nearConnector.on('wallet:signIn', (event) => {
        console.log('🟢 wallet:signIn', event);
        const accountId = event.accounts[0]?.accountId;

        setWalletState({ isConnected: true, accountId, isConnecting: false });
        try { document.body.classList.remove('wallet-modal-open'); } catch {}

        localStorage.removeItem('game-storage');
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAccountId', accountId || '');

        toast({ title: 'Кошелек подключен', description: `Аккаунт: ${accountId}` });

        // Defer Supabase operations to prevent deadlock
        if (accountId) {
          setTimeout(async () => {
            try {
              await saveWalletConnection(accountId, true);

              console.log('🎮 Ensuring game_data exists');
              await supabase.rpc('ensure_game_data_exists', {
                p_wallet_address: accountId
              });

              // Authenticate this wallet with Supabase (creates/links user + profile)
              await supabase.rpc('authenticate_wallet_session', {
                p_wallet_address: accountId,
                p_signature: '',
                p_message: ''
              });

              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: `${accountId}@wallet.local`,
                password: 'wallet-auth'
              });
              if (signInError) {
                console.error('Supabase auth error:', signInError);
              } else if (signInData?.user) {
                await supabase
                  .from('game_data')
                  .update({ user_id: signInData.user.id })
                  .eq('wallet_address', accountId);
              }

              console.log('🎮 Syncing NFT cards');
              await syncNFTCards(accountId);

              try {
                console.log('🔍 Checking NFT whitelist');
                const { data, error } = await supabase.functions.invoke('check-nft-whitelist', {
                  body: { wallet_address: accountId }
                });
                
                if (error) {
                  console.log('⚠️ NFT whitelist check failed:', error);
                } else if (data?.addedToWhitelist) {
                  console.log('✅ Added to whitelist via NFT');
                }
              } catch (whitelistError) {
                console.log('⚠️ NFT whitelist check failed (non-critical):', whitelistError);
              }

              window.dispatchEvent(new CustomEvent('wallet-changed', { detail: { walletAddress: accountId } }));

              console.log('🔄 Navigating to menu');
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
        console.log('🔴 wallet:signOut');
        
        const currentAccountId = localStorage.getItem('walletAccountId');

        setWalletState({ isConnected: false, accountId: null, isConnecting: false });
        try { document.body.classList.remove('wallet-modal-open'); } catch {}
        
        if (currentAccountId) {
          await saveWalletConnection(currentAccountId, false);
        }

        try { await supabase.auth.signOut(); } catch (e) { console.warn('Supabase signOut error', e); }

        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAccountId');
        localStorage.removeItem('game-storage');
        localStorage.removeItem('gameCards');
        localStorage.removeItem('gameBalance');
        localStorage.removeItem('gameInventory');

        toast({ title: 'Кошелек отключен', description: 'Вы успешно отключили кошелек' });

        window.dispatchEvent(new Event('wallet-disconnected'));
        navigate('/auth', { replace: true });
      });
    }

    const isConnected = localStorage.getItem('walletConnected') === 'true';
    const accountId = localStorage.getItem('walletAccountId');

    console.log('📂 localStorage:', { isConnected, accountId });

    if (isConnected && accountId) {
      console.log('🔄 Restoring wallet state');
      setWalletState({ isConnected: true, accountId, isConnecting: false });
    } else {
      setWalletState((prev) => ({ ...prev, isConnecting: false }));
    }

    return () => {
      console.log('🧹 useWallet cleanup');
    };
  }, [toast, navigate, syncNFTCards]);

  const connectWallet = useCallback(async () => {
    console.log('🎯 connectWallet called - opening HERE Wallet');
    
    setWalletState(prev => ({ ...prev, isConnecting: true }));

    try {
      // Прямое открытие HERE Wallet бота в Telegram
      const hereWalletUrl = 'https://t.me/herewalletbot/app';
      console.log('🔗 Opening HERE Wallet:', hereWalletUrl);
      
      openExternalLink(hereWalletUrl);
      
      // Даем время на переход в бот
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      toast({
        title: "Ошибка подключения",
        description: "Не удалось открыть HERE Wallet",
        variant: "destructive"
      });
    } finally {
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [toast]);

  const disconnectWallet = useCallback(async () => {
    try {
      const currentAccountId = walletState.accountId;
      
      setWalletState({
        isConnected: false,
        accountId: null,
        isConnecting: false
      });
      
      if (currentAccountId) {
        await saveWalletConnection(currentAccountId, false);
      }
      
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAccountId');
      localStorage.removeItem('gameCards');
      
      if (connector) {
        const wallet = await connector.wallet();
        if (wallet) {
          await wallet.signOut();
        }
      }
      
      navigate('/auth', { replace: true });
      
    } catch (error) {
      console.error('Disconnect error:', error);
      navigate('/auth', { replace: true });
    }
  }, [connector, walletState.accountId, navigate]);

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