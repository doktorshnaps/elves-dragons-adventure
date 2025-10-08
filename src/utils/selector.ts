// src/utils/selector.ts
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";

interface InitSelectorParams {
  miniApp?: boolean;
  telegramInitData?: string;
}

export async function initSelector({ 
  miniApp = false, 
  telegramInitData = "" 
}: InitSelectorParams) {
  // Перехватываем window.open для Telegram Mini App
  if (miniApp && window.Telegram?.WebApp) {
    const originalOpen = window.open;
    window.open = function(url: any, target?: any, features?: any) {
      if (typeof url === 'string' && url.includes('wallet.hot')) {
        console.log('🔗 Opening HOT Wallet in Telegram:', url);
        window.Telegram?.WebApp?.openLink(url);
        return null;
      }
      return originalOpen.call(window, url, target, features);
    };
  }

  return await setupWalletSelector({
    network: "mainnet",
    modules: [
      setupHotWallet(),
    ],
  });
}
