// src/hooks/useWallet.ts — универсальная модель на базе селектора/коннектора
import { useEffect, useMemo, useState } from 'react';
import { NearConnector } from '@hot-labs/near-connect';

// Детект окружений
const isTelegramWebApp = () =>
  typeof window !== 'undefined' && (window as any).Telegram?.WebApp;

const isEmbedded = () =>
  typeof window !== 'undefined' && window.location !== window.parent.location;

// Безопасное открытие внешних ссылок (Telegram/WebView/браузер)
const openExternalLink = (url: string) => {
  const inTg = isTelegramWebApp();

  if (inTg) {
    const tg = (window as any).Telegram.WebApp;
    if (/^tg:\/\//i.test(url) || /t\.me\//i.test(url)) {
      tg.openTelegramLink(url);
    } else {
      tg.openLink(url, { try_instant_view: false });
    }
    return;
  }

  if (isEmbedded()) {
    try {
      window.parent.postMessage({ type: 'OPEN_EXTERNAL_LINK', url }, '*');
      return;
    } catch { /* ignore */ }
  }

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Singleton NearConnector
let singletonConnector: NearConnector | null = null;

export function useWallet() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connector = useMemo(() => {
    if (!singletonConnector) {
      singletonConnector = new NearConnector({
        network: 'mainnet',
        walletConnect: {
          // Заполните при использовании WC-кошельков
          projectId: '',
          metadata: {
            name: 'Your Dapp',
            description: 'Your Dapp on NEAR',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://your.app',
            icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : ''],
          },
        },
        // Критично: единая точка редиректа для мобильных/WebView/Telegram
        onWalletRedirect: (url: string) => {
          try {
            openExternalLink(url);
            return false; // обработали сами
          } catch {
            return true;  // пусть NearConnector применит дефолт
          }
        },
        logger: console,
        // При необходимости можно отфильтровать кошельки по фичам:
        // features: { signMessage: true, testnet: false },
      });
    }
    return singletonConnector!;
  }, []);

  // Подписки на события входа/выхода
  useEffect(() => {
    const onSignIn = async (t: any) => {
      const id = t?.accounts?.[0]?.accountId || null;
      setAccountId(id);
    };
    const onSignOut = async () => setAccountId(null);

    connector.on('wallet:signIn', onSignIn);
    connector.on('wallet:signOut', onSignOut);

    return () => {
      connector.off?.('wallet:signIn', onSignIn);
      connector.off?.('wallet:signOut', onSignOut);
    };
  }, [connector]);

  // Запуск подключения (модалка/выбор кошелька)
  const connect = async () => {
    try {
      setConnecting(true);
      // Даем кадр на рендер, чтобы модалка была готова
      requestAnimationFrame(() => setTimeout(() => connector.connect(), 60));
    } catch (e) {
      console.warn('connect failed', e);
    } finally {
      setTimeout(() => setConnecting(false), 200);
    }
  };

  const disconnect = async () => {
    try {
      await connector.signOut();
    } catch (e) {
      console.warn('signOut failed', e);
    }
  };

  // Универсальные методы кошелька
  const signMessage = async (message: string) => {
    const wallet = await connector.wallet();
    return wallet.signMessage({ message });
  };

  const signAndSendTransaction = async (tx: any) => {
    const wallet = await connector.wallet();
    return wallet.signAndSendTransaction(tx);
  };

  const signAndSendTransactions = async (txs: any[]) => {
    const wallet = await connector.wallet();
    return wallet.signAndSendTransactions(txs);
  };

  return {
    accountId,
    connecting,
    connect,
    disconnect,
    signMessage,
    signAndSendTransaction,
    signAndSendTransactions,
    connector,
  };
}
