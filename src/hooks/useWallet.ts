// src/hooks/useWallet.ts
import { useWalletContext } from '@/contexts/WalletConnectContext';

export function useWallet() {
  const { 
    selector, 
    accountId, 
    isLoading, 
    connect, 
    disconnect 
  } = useWalletContext();

  // Методы для работы с транзакциями
  const signMessage = async (params: any) => {
    if (!selector) throw new Error('Wallet selector not initialized');
    const wallet = await selector.wallet();
    return wallet.signMessage(params);
  };

  const signAndSendTransaction = async (tx: any) => {
    if (!selector) throw new Error('Wallet selector not initialized');
    const wallet = await selector.wallet();
    return wallet.signAndSendTransaction(tx);
  };

  const signAndSendTransactions = async (txs: any[]) => {
    if (!selector) throw new Error('Wallet selector not initialized');
    const wallet = await selector.wallet();
    return wallet.signAndSendTransactions({ transactions: txs });
  };

  return {
    accountId,
    connecting: isLoading,
    isConnecting: isLoading,
    isConnected: !!accountId,
    connect,
    connectWallet: connect,
    disconnect,
    disconnectWallet: disconnect,
    signMessage,
    signAndSendTransaction,
    signAndSendTransactions,
    selector,
  };
}

