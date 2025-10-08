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

    const isProviderUrl = (url: string) =>
      url.includes('wallet.hot') || url.includes('herewallet') || url.includes('herewallet.app');
    const isTelegramDeepLink = (url: string) =>
      url.startsWith('tg://') || url.includes('t.me/') || url.includes('telegram.me/');
    const withTelegramParam = (url: string) =>
      url.startsWith('http') ? (url.includes('?') ? `${url}&telegram=true` : `${url}?telegram=true`) : url;

    // Авто-открытие ссылки на Telegram из отрисованной модалки провайдера
    try {
      let autoOpened = false;
      const tryAutoOpen = () => {
        if (autoOpened) return false;
        const anchor = document.querySelector(
          'a[href^="https://t.me/"], a[href^="tg://"], a[href*="telegram.me/"]'
        ) as HTMLAnchorElement | null;
        if (anchor?.href) {
          autoOpened = true;
          console.log('🔗 Auto-opening Telegram link from provider UI:', anchor.href);
          tg.openLink(anchor.href);
          // Попробуем закрыть модалку провайдера, если есть кнопка закрытия
          const closeBtn = document.querySelector(
            'button[aria-label="Close"], button[aria-label="Close modal"], [data-test="close"], .close, .modal-close'
          ) as HTMLElement | null;
          try { closeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch {}
          return true;
        }
        return false;
      };
      const observer = new MutationObserver(() => tryAutoOpen());
      observer.observe(document.body, { childList: true, subtree: true });
      // Первая попытка сразу после инициализации
      setTimeout(() => tryAutoOpen(), 300);
    } catch (e) {
      console.warn('⚠️ Telegram auto-open observer failed:', e);
    }
    
    // Перехват window.open
    window.open = function (url: any, target?: any, features?: any) {
      if (typeof url === 'string' && (isProviderUrl(url) || isTelegramDeepLink(url))) {
        console.log('🔗 Telegram redirect intercepted (window.open):', url);
        const redirectUrl = isTelegramDeepLink(url) ? url : withTelegramParam(url);
        tg.openLink(redirectUrl);
        return null;
      }
      return originalOpen.call(window, url, target, features);
    } as any;

    // Перехват window.location.assign
    window.location.assign = function (url: string) {
      if (isProviderUrl(url) || isTelegramDeepLink(url)) {
        console.log('🔗 Telegram redirect intercepted (location.assign):', url);
        const redirectUrl = isTelegramDeepLink(url) ? url : withTelegramParam(url);
        tg.openLink(redirectUrl);
        return;
      }
      return originalAssign.call(window.location, url);
    } as any;

    // Перехват window.location.replace
    window.location.replace = function (url: string) {
      if (isProviderUrl(url) || isTelegramDeepLink(url)) {
        console.log('🔗 Telegram redirect intercepted (location.replace):', url);
        const redirectUrl = isTelegramDeepLink(url) ? url : withTelegramParam(url);
        tg.openLink(redirectUrl);
        return;
      }
      return originalReplace.call(window.location, url);
    } as any;
  }

  return await setupWalletSelector({
    network: "mainnet",
    modules: [
      setupHotWallet(),
    ],
  });
}
