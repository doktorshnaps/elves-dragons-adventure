// src/hooks/useTelegram.ts
import { useEffect, useState } from "react";

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string, options?: { try_instant_view: boolean }) => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  isExpanded?: boolean;
  platform?: string;
  version?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export default function useTelegram() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [tgWebApp, setTgWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    let isRealTelegram = false;
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      isRealTelegram =
        !!tg.initDataUnsafe &&
        !!tg.initDataUnsafe.user &&
        typeof tg.initDataUnsafe.user.id !== "undefined";
      setTgWebApp(tg);

      if (isRealTelegram) {
        try {
          // Critical for iOS: signal ready and expand to full height ASAP
          // to prevent the WebView from collapsing/remounting.
          tg.ready?.();
          if (!tg.isExpanded) tg.expand?.();

          // On iOS, vertical swipes can accidentally close the WebApp
          // (perceived by users as "the app crashed and reloaded").
          tg.disableVerticalSwipes?.();
        } catch (e) {
          console.warn('⚠️ [useTelegram] init call failed:', e);
        }
      }
    }
    setIsTelegram(isRealTelegram);
  }, []);

  return { isTelegram, tgWebApp };
}
