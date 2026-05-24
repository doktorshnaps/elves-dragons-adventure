// src/contexts/WalletConnectContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { WalletSelector, AccountState } from "@near-wallet-selector/core";
import useTelegram from "@/hooks/useTelegram";
import { initSelector } from "@/utils/selector";
import { initWibe3, getWibe3 } from "@/lib/wibe3";
import { useQueryClient } from "@tanstack/react-query";
import { GUEST_DEMO_WALLET, setGuestRuntimeFlag } from "@/utils/guestMode";

interface WalletContextType {
  selector: WalletSelector | null;
  accountId: string | null;
  nearAccountId: string | null; // Real NEAR account from wallet.getAccounts()
  isLoading: boolean;
  hasError: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  // Гостевой режим (демо-аккаунт без возможности мутаций)
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => Promise<void>;
  // New: HotConnector multichain support
  wibe3: any | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  tonAddress: string | null;
}

const WalletContext = createContext<WalletContextType>({
  selector: null,
  accountId: null,
  nearAccountId: null,
  isLoading: true,
  hasError: false,
  connect: async () => {},
  disconnect: async () => {},
  isGuest: false,
  enterGuestMode: () => {},
  exitGuestMode: async () => {},
  wibe3: null,
  evmAddress: null,
  solanaAddress: null,
  tonAddress: null,
});

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const { tgWebApp } = useTelegram();
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [accountId, setAccountId] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('guestMode') === 'true') {
        return GUEST_DEMO_WALLET;
      }
    } catch {}
    return null;
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('guestMode') === 'true';
    } catch {
      return false;
    }
  });
  const [nearAccountId, setNearAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !(typeof window !== 'undefined' && localStorage.getItem('guestMode') === 'true');
    } catch {
      return true;
    }
  });
  const [hasError, setHasError] = useState(false);
  const [wibe3, setWibe3] = useState<any>(null);
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [tonAddress, setTonAddress] = useState<string | null>(null);
  const queryClientRef = useRef<ReturnType<typeof useQueryClient> | null>(null);

  // Get queryClient inside provider (after QueryClientProvider is available)
  try {
    queryClientRef.current = useQueryClient();
  } catch {
    // QueryClient not available yet
  }

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Держим runtime-флаг в window, чтобы обёртка supabase-клиента могла блокировать записи.
  useEffect(() => {
    setGuestRuntimeFlag(isGuest);
    (window as any).__WALLET_ADDRESS__ = accountId;
  }, [isGuest, accountId]);

  // Инициализация wallet-selector
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      console.log('🚀 [WalletContext] Starting wallet bootstrap...');
      console.time('⏱️ Wallet Bootstrap');
      performance.mark('wallet-bootstrap-start');
      setIsLoading(true);
      setHasError(false);

      try {
        console.log('📡 [WalletContext] Initializing wallet selector...');
        
        // Add 10 second timeout for wallet selector initialization
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Wallet selector initialization timeout')), 10000);
        });
        
        const sel = await Promise.race([
          initSelector({
            miniApp: !!tgWebApp,
            telegramInitData: tgWebApp?.initData || "",
          }),
          timeoutPromise
        ]) as any;
        
        if (cancelled) return;
        
        console.log('✅ [WalletContext] Wallet selector initialized');

        setSelector(sel);
        
        performance.mark('wallet-selector-ready');
        performance.measure('Wallet Selector Init', 'wallet-bootstrap-start', 'wallet-selector-ready');

        // 1) Гидратация активного аккаунта синхронно из store
        try {
          const state = sel.store.getState();
          const active = state.accounts?.find((a: AccountState) => a.active);
          const id = active?.accountId || null;
          setAccountId(id);
          
          // Get real NEAR account immediately
          if (id && state.selectedWalletId) {
            try {
              const wallet = await sel.wallet(state.selectedWalletId);
              const accounts = await wallet.getAccounts();
              const nearAccount = accounts?.[0]?.accountId || null;
              console.log('🔍 Initial NEAR account:', nearAccount, 'from wallet accounts:', accounts);
              setNearAccountId(nearAccount);
            } catch (e) {
              console.warn('Failed to get initial NEAR accounts:', e);
              setNearAccountId(null);
            }
          } else {
            setNearAccountId(null);
          }
        } catch (e) {
          console.warn("[wallet] store hydrate error:", e);
          setAccountId(null);
          setNearAccountId(null);
        }

        // 2) Подписка на изменения store
        try {
          unsubscribeRef.current?.();
        } catch {}
        
        const subscription = sel.store.observable.subscribe(async (nextState) => {
          performance.mark('wallet-state-change-start');
          const active = nextState.accounts?.find((a: AccountState) => a.active);
          const id = active?.accountId || null;
          
          // Проверяем, изменился ли accountId перед обновлением
          if (id !== accountId) {
            console.log(`🔄 Wallet account changed: ${accountId} -> ${id}`);
            console.time('⏱️ Wallet Account Update');
            setAccountId(id);
            
            // Store wallet address globally for secure storage access
            (window as any).__WALLET_ADDRESS__ = id;
            
            // Инвалидируем кэш при смене кошелька
            if (queryClientRef.current) {
              queryClientRef.current.invalidateQueries({ queryKey: ['gameData'] });
              queryClientRef.current.invalidateQueries({ queryKey: ['cardInstances'] });
              queryClientRef.current.invalidateQueries({ queryKey: ['itemInstances'] });
            }
            
            // Get real NEAR account only if accountId changed
            if (id && nextState.selectedWalletId) {
              try {
                performance.mark('wallet-get-accounts-start');
                const wallet = await sel.wallet(nextState.selectedWalletId);
                const accounts = await wallet.getAccounts();
                const nearAccount = accounts?.[0]?.accountId || null;
                console.log('🔍 Real NEAR account:', nearAccount, 'from wallet accounts:', accounts);
                setNearAccountId(nearAccount);
                
                performance.mark('wallet-get-accounts-end');
                performance.measure('Wallet Get Accounts', 'wallet-get-accounts-start', 'wallet-get-accounts-end');
                console.timeEnd('⏱️ Wallet Account Update');
              } catch (e) {
                console.warn('Failed to get NEAR accounts:', e);
                setNearAccountId(null);
              }
            } else {
              setNearAccountId(null);
              console.timeEnd('⏱️ Wallet Account Update');
            }
            
            performance.mark('wallet-state-change-end');
            performance.measure('Wallet State Change', 'wallet-state-change-start', 'wallet-state-change-end');
          }
        });
        unsubscribeRef.current = () => subscription.unsubscribe();

        setHasError(false);
        setIsLoading(false);
        
        performance.mark('wallet-bootstrap-end');
        performance.measure('Wallet Bootstrap Total', 'wallet-bootstrap-start', 'wallet-bootstrap-end');
        console.timeEnd('⏱️ Wallet Bootstrap');
        
        const measures = performance.getEntriesByType('measure').filter(m => m.name.includes('Wallet'));
        console.log('📊 Wallet Bootstrap Performance:');
        measures.forEach(measure => {
          console.log(`  ${measure.name}: ${Math.round(measure.duration)}ms`);
        });

        // Initialize HotConnector (wibe3) in parallel - non-blocking
        try {
          console.log('🔗 [WalletContext] Initializing HotConnector (wibe3)...');
          const connector = await initWibe3();
          if (!cancelled && connector) {
            setWibe3(connector);
            console.log('✅ [WalletContext] HotConnector initialized');
            
            // Subscribe to wallet changes from HotConnector
            if (connector.near?.address) {
              console.log('🔍 [WalletContext] NEAR from HotConnector:', connector.near.address);
            }
            if (connector.evm?.address) {
              setEvmAddress(connector.evm.address);
              console.log('🔍 [WalletContext] EVM address:', connector.evm.address);
            }
            if (connector.solana?.address) {
              setSolanaAddress(connector.solana.address);
              console.log('🔍 [WalletContext] Solana address:', connector.solana.address);
            }
            if (connector.ton?.address) {
              setTonAddress(connector.ton.address);
              console.log('🔍 [WalletContext] TON address:', connector.ton.address);
            }
          }
        } catch (wibe3Err) {
          console.warn('⚠️ [WalletContext] HotConnector init failed (non-critical):', wibe3Err);
          // Continue without HotConnector - NEAR wallet still works
        }

      } catch (err) {
        console.error("❌ [WalletContext] Initialization error:", err);
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
          // Still allow app to continue without wallet
          console.log('⚠️ [WalletContext] Continuing without wallet initialization');
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, [tgWebApp]);

  // Синхронизация статуса подключения
  useEffect(() => {
    try {
      if (accountId) {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAccountId', accountId);
        // For NEAR balances, use the real NEAR account if available
        if (nearAccountId) {
          localStorage.setItem('nearAccountId', nearAccountId);
        }
      } else {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAccountId');
        localStorage.removeItem('nearAccountId');
      }
    } catch {}
  }, [accountId, nearAccountId]);

  // Функция подключения кошелька через HOT Wallet
  const connect = async () => {
    // Если активен гостевой режим — выходим из него перед реальным коннектом
    if (isGuest) {
      try { await exitGuestMode(); } catch {}
    }
    if (!selector) {
      console.warn("[wallet] selector not ready");
      return;
    }
    try {
      const wallet = await selector.wallet("hot-wallet");
      
      // Для Telegram Mini App добавляем параметр telegram=true в URL
      const signInParams: any = {
        contractId: "social.near", // требуется непустой contractId для корректного логина
        methodNames: [],
      };
      
      // Если в Telegram, добавляем параметр для автоматического выбора Telegram варианта
      if (tgWebApp) {
        const baseUrl = window.location.href.split('#')[0];
        const urlWithParam = baseUrl.includes('?') ? `${baseUrl}&telegram=true` : `${baseUrl}?telegram=true`;
        signInParams.successUrl = urlWithParam;
        signInParams.failureUrl = urlWithParam;
      }
      
      await (wallet as any).signIn(signInParams);
      console.log('✅ Wallet connection initiated');
    } catch (error) {
      console.error("[wallet] connect error:", error);
      throw error;
    }
  };

  const enterGuestMode = () => {
    try {
      localStorage.setItem('guestMode', 'true');
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAccountId', GUEST_DEMO_WALLET);
    } catch {}
    setIsGuest(true);
    setAccountId(GUEST_DEMO_WALLET);
    setNearAccountId(null);
    setIsLoading(false);
    setHasError(false);
    setGuestRuntimeFlag(true);
    if (queryClientRef.current) {
      queryClientRef.current.invalidateQueries({ queryKey: ['gameData'] });
      queryClientRef.current.invalidateQueries({ queryKey: ['cardInstances'] });
      queryClientRef.current.invalidateQueries({ queryKey: ['itemInstances'] });
    }
    console.log('🎭 [WalletContext] Entered guest mode as', GUEST_DEMO_WALLET);
  };

  const exitGuestMode = async () => {
    try {
      localStorage.removeItem('guestMode');
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAccountId');
      localStorage.removeItem('nearAccountId');
    } catch {}
    setIsGuest(false);
    setAccountId(null);
    setNearAccountId(null);
    setGuestRuntimeFlag(false);
    if (queryClientRef.current) {
      queryClientRef.current.clear();
    }
    console.log('🎭 [WalletContext] Exited guest mode');
  };

  // Функция отключения кошелька
  const disconnect = async () => {
    if (isGuest) {
      await exitGuestMode();
      return;
    }
    if (!selector) return;
    try {
      const state = selector.store.getState();
      const activeWalletId = state.selectedWalletId;
      if (!activeWalletId) return;
      
      const wallet = await selector.wallet(activeWalletId);
      await wallet.signOut();
      setAccountId(null);
      setNearAccountId(null);
      
      // КРИТИЧЕСКИ ВАЖНО: Полная очистка всех игровых данных из localStorage
      const keysToRemove = [
        'walletAccountId',
        'walletConnected',
        'gameData',
        'gameCards',
        'gameBalance',
        'gameInitialized',
        'gameInventory',
        'marketplaceListings',
        'socialQuests',
        'adventurePlayerStats',
        'adventureCurrentMonster',
        'dragonEggs',
        'battleState',
        'selectedTeam',
        'activeBattleInProgress',
        'battleHeroes',
        'battleDragons',
        'barracksUpgrades',
        'dragonLairUpgrades'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove ${key} from localStorage:`, e);
        }
      });
      
      // Очищаем весь кэш React Query вместо window.dispatchEvent
      if (queryClientRef.current) {
        queryClientRef.current.clear();
      }
      
      console.log('✅ Wallet disconnected and all game data cleared');
    } catch (e) {
      console.warn("[wallet] disconnect error:", e);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        selector,
        accountId,
        nearAccountId,
        isLoading,
        hasError,
        connect,
        disconnect,
        isGuest,
        enterGuestMode,
        exitGuestMode,
        wibe3,
        evmAddress,
        solanaAddress,
        tonAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  return useContext(WalletContext);
}