// src/contexts/WalletConnectContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { WalletSelector, AccountState } from "@near-wallet-selector/core";
import useTelegram from "@/hooks/useTelegram";
import { initSelector } from "@/utils/selector";

interface WalletContextType {
  selector: WalletSelector | null;
  accountId: string | null;
  isLoading: boolean;
  hasError: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  selector: null,
  accountId: null,
  isLoading: true,
  hasError: false,
  connect: async () => {},
  disconnect: async () => {},
});

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const { tgWebApp } = useTelegram();
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Инициализация wallet-selector
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      setHasError(false);

      try {
        const sel = await initSelector({
          miniApp: !!tgWebApp,
          telegramInitData: tgWebApp?.initData || "",
        });
        if (cancelled) return;

        setSelector(sel);

        // Гидратация активного аккаунта
        try {
          const state = sel.store.getState();
          const active = state.accounts?.find((a: AccountState) => a.active);
          
          if (active?.accountId) {
            setAccountId(active.accountId);
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAccountId', active.accountId);
            console.log('💾 Wallet hydrated:', active.accountId);
          } else {
            // Проверяем localStorage для восстановления после редиректа
            const savedAccountId = localStorage.getItem('walletAccountId');
            const wasConnected = localStorage.getItem('walletConnected');
            
            if (wasConnected && savedAccountId) {
              console.log('🔄 Restoring wallet from localStorage:', savedAccountId);
              setAccountId(savedAccountId);
              
              // Даем время на полную инициализацию wallet-selector
              setTimeout(async () => {
                try {
                  const freshState = sel.store.getState();
                  const freshActive = freshState.accounts?.find((a: AccountState) => a.active);
                  if (freshActive?.accountId) {
                    setAccountId(freshActive.accountId);
                    console.log('✅ Wallet fully restored:', freshActive.accountId);
                  }
                } catch (err) {
                  console.warn("[wallet] delayed hydration error:", err);
                }
              }, 1000);
            } else {
              setAccountId(null);
            }
          }
        } catch (e) {
          console.warn("[wallet] store hydrate error:", e);
          setAccountId(null);
        }

        // Подписка на изменения store
        try {
          unsubscribeRef.current?.();
        } catch {}

        const subscription = sel.store.observable.subscribe((state) => {
          const active = state.accounts?.find((a: AccountState) => a.active);
          const newAccountId = active?.accountId || null;
          setAccountId(newAccountId);
          
          // Обновляем localStorage
          if (newAccountId) {
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAccountId', newAccountId);
            console.log('💾 Wallet connected:', newAccountId);
          } else {
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAccountId');
            console.log('💾 Wallet disconnected');
          }
        });

        unsubscribeRef.current = () => subscription.unsubscribe();

        setIsLoading(false);
      } catch (err) {
        console.error("[wallet] init error:", err);
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, [tgWebApp]);

  // Функция подключения кошелька напрямую через HOT Wallet
  const connect = async () => {
    if (!selector) {
      console.warn("[wallet] selector not ready");
      return;
    }
    try {
      const wallet = await selector.wallet("hot-wallet");
      await (wallet as any).signIn({
        contractId: "",
      });
      console.log('✅ Wallet connection initiated');
    } catch (error) {
      console.error("[wallet] connect error:", error);
      throw error;
    }
  };

  // Функция отключения кошелька
  const disconnect = async () => {
    if (!selector) return;
    try {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setAccountId(null);
      
      // Очищаем localStorage от wallet данных
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAccountId');
      
      // Очищаем все игровые данные из localStorage
      const gameKeys = [
        'game-storage',
        'gameCards',
        'gameBalance',
        'gameInventory',
        'gameDragonEggs',
        'gameSelectedTeam',
        'game_balance',
        'game_cards',
        'game_inventory',
        'game_dragonEggs',
        'game_selectedTeam',
        'game_accountLevel',
        'game_accountExperience'
      ];
      
      gameKeys.forEach(key => localStorage.removeItem(key));
      
      console.log('✅ Wallet disconnected and all localStorage cleared');
    } catch (e) {
      console.warn("[wallet] disconnect error:", e);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        selector,
        accountId,
        isLoading,
        hasError,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  return useContext(WalletContext);
}
