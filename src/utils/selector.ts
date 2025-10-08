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
  // Перехватываем редиректы для Telegram Mini App
  if (miniApp && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    const originalOpen = window.open;
    const originalAssign = window.location.assign;
    const originalReplace = window.location.replace;
    
    // Перехват window.open
    window.open = function(url: any, target?: any, features?: any) {
      if (typeof url === 'string' && (url.includes('wallet.hot') || url.includes('herewallet'))) {
        console.log('🔗 Telegram redirect intercepted (window.open):', url);
        // Добавляем параметр telegram=true для автоматического выбора
        const redirectUrl = url.includes('?') ? `${url}&telegram=true` : `${url}?telegram=true`;
        tg.openLink(redirectUrl);
        return null;
      }
      return originalOpen.call(window, url, target, features);
    };
    
    // Перехват window.location.assign
    window.location.assign = function(url: string) {
      if (url.includes('wallet.hot') || url.includes('herewallet')) {
        console.log('🔗 Telegram redirect intercepted (location.assign):', url);
        const redirectUrl = url.includes('?') ? `${url}&telegram=true` : `${url}?telegram=true`;
        tg.openLink(redirectUrl);
        return;
      }
      return originalAssign.call(window.location, url);
    };
    
    // Перехват window.location.replace
    window.location.replace = function(url: string) {
      if (url.includes('wallet.hot') || url.includes('herewallet')) {
        console.log('🔗 Telegram redirect intercepted (location.replace):', url);
        const redirectUrl = url.includes('?') ? `${url}&telegram=true` : `${url}?telegram=true`;
        tg.openLink(redirectUrl);
        return;
      }
      return originalReplace.call(window.location, url);
    };
  }

  return await setupWalletSelector({
    network: "mainnet",
    modules: [
      setupHotWallet(),
    ],
  });
}
