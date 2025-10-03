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
  openTelegramLink: (url: string) => void;
  openLink: (url: string, options?: { try_instant_view: boolean }) => void;
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
    }
    setIsTelegram(isRealTelegram);
  }, []);

  return { isTelegram, tgWebApp };
}
