// src/contexts/WalletConnectContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { setupModal } from "@near-wallet-selector/modal-ui";
import type { WalletSelector, AccountState } from "@near-wallet-selector/core";
import useTelegram from "@/hooks/useTelegram";
import { initSelector } from "@/utils/selector";
import "@near-wallet-selector/modal-ui/styles.css";

interface WalletContextType {
  selector: WalletSelector | null;
  modal: any;
  accountId: string | null;
  isLoading: boolean;
  hasError: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  selector: null,
  modal: null,
  accountId: null,
  isLoading: true,
  hasError: false,
  connect: async () => {},
  disconnect: async () => {},
});

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const { tgWebApp } = useTelegram();
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
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

        // Создаем модалку
        const walletModal = setupModal(sel, {
          contractId: "",
        });
        setModal(walletModal);

        // Гидратация активного аккаунта
        try {
          const state = sel.store.getState();
          const active = state.accounts?.find((a: AccountState) => a.active);
          setAccountId(active?.accountId || null);
          
          // Сохраняем в localStorage
          if (active?.accountId) {
            localStorage.setItem('walletConnected', 'true');
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
          } else {
            localStorage.removeItem('walletConnected');
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

  // Функция подключения кошелька
  const connect = async () => {
    if (!modal) {
      console.warn("[wallet] modal not ready");
      return;
    }
    modal.show();
  };

  // Функция отключения кошелька
  const disconnect = async () => {
    if (!selector) return;
    try {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setAccountId(null);
      localStorage.removeItem('walletConnected');
    } catch (e) {
      console.warn("[wallet] disconnect error:", e);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        selector,
        modal,
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
