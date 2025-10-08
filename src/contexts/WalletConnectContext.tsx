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

        // 1) Гидратация активного аккаунта синхронно из store
        try {
          const state = sel.store.getState();
          const active = state.accounts?.find((a: AccountState) => a.active);
          setAccountId(active?.accountId || null);
        } catch (e) {
          console.warn("[wallet] store hydrate error:", e);
          setAccountId(null);
        }

        // 2) Подписка на изменения store
        try {
          unsubscribeRef.current?.();
        } catch {}
        
        const subscription = sel.store.observable.subscribe((nextState) => {
          const active = nextState.accounts?.find((a: AccountState) => a.active);
          setAccountId(active?.accountId || null);
        });
        unsubscribeRef.current = () => subscription.unsubscribe();

        setHasError(false);
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

  // Функция подключения кошелька через HOT Wallet
  const connect = async () => {
    if (!selector) {
      console.warn("[wallet] selector not ready");
      return;
    }
    try {
      const wallet = await selector.wallet("hot-wallet");
      await (wallet as any).signIn({
        contractId: "",
        methodNames: [],
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
      const state = selector.store.getState();
      const activeWalletId = state.selectedWalletId;
      if (!activeWalletId) return;
      
      const wallet = await selector.wallet(activeWalletId);
      await wallet.signOut();
      setAccountId(null);
      
      console.log('✅ Wallet disconnected');
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
