// src/utils/selector.ts
// Use dynamic imports to avoid circular init issues in production bundles


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
          return true;
        }
        return false;
      };
      const observer = new MutationObserver(() => tryAutoOpen());
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => tryAutoOpen(), 300);
    } catch (e) {
      console.warn('⚠️ Telegram auto-open observer failed:', e);
    }
    
    // Безопасный перехват window.open с защитой от рекурсии
    try {
      const originalOpen = window.open;
      let isIntercepting = false;
      window.open = function (url: any, target?: any, features?: any) {
        // ✅ FIX: Re-entry guard to prevent window.open -> tg.openLink -> window.open infinite loop
        if (isIntercepting) return originalOpen.call(window, url, target, features);
        if (typeof url === 'string' && (isProviderUrl(url) || isTelegramDeepLink(url))) {
          console.log('🔗 Telegram redirect intercepted (window.open):', url);
          const redirectUrl = isTelegramDeepLink(url) ? url : withTelegramParam(url);
          isIntercepting = true;
          try {
            tg.openLink(redirectUrl);
          } finally {
            isIntercepting = false;
          }
          return null;
        }
        return originalOpen.call(window, url, target, features);
      } as any;
    } catch (e) {
      console.warn('⚠️ Failed to override window.open:', e);
    }

    // Безопасный перехват window.location.assign используя Object.defineProperty
    try {
      const locationDescriptor = Object.getOwnPropertyDescriptor(window.location, 'assign');
      if (!locationDescriptor || locationDescriptor.configurable) {
        const originalAssign = window.location.assign.bind(window.location);
        Object.defineProperty(window.location, 'assign', {
          value: function (url: string) {
            if (isProviderUrl(url) || isTelegramDeepLink(url)) {
              console.log('🔗 Telegram redirect intercepted (location.assign):', url);
              const redirectUrl = isTelegramDeepLink(url) ? url : withTelegramParam(url);
              tg.openLink(redirectUrl);
              return;
            }
            return originalAssign(url);
          },
          writable: true,
          configurable: true
        });
      }
    } catch (e) {
      console.warn('⚠️ Failed to override location.assign (read-only in iframe):', e);
    }

    // Безопасный перехват window.location.replace используя Object.defineProperty
    try {
      const locationDescriptor = Object.getOwnPropertyDescriptor(window.location, 'replace');
      if (!locationDescriptor || locationDescriptor.configurable) {
        const originalReplace = window.location.replace.bind(window.location);
        Object.defineProperty(window.location, 'replace', {
          value: function (url: string) {
            if (isProviderUrl(url) || isTelegramDeepLink(url)) {
              console.log('🔗 Telegram redirect intercepted (location.replace):', url);
              const redirectUrl = isTelegramDeepLink(url) ? url : withTelegramParam(url);
              tg.openLink(redirectUrl);
              return;
            }
            return originalReplace(url);
          },
          writable: true,
          configurable: true
        });
      }
    } catch (e) {
      console.warn('⚠️ Failed to override location.replace (read-only in iframe):', e);
    }
  }

  const [{ setupWalletSelector }, { setupHotWallet }] = await Promise.all([
    import("@near-wallet-selector/core"),
    import("@near-wallet-selector/hot-wallet"),
  ]);

  return await setupWalletSelector({
    network: "mainnet",
    modules: [
      setupHotWallet(),
    ],
  });
}
