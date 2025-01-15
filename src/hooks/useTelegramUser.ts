import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            username?: string;
          };
        };
        ready: () => void;
      };
    };
  }
}

export const useTelegramUser = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const initTelegram = () => {
      if (window.Telegram?.WebApp) {
        const { user } = window.Telegram.WebApp.initDataUnsafe;
        if (user) {
          setUserId(user.id);
          setUserName(user.first_name);
          
          // Сохраняем ID пользователя в localStorage
          localStorage.setItem('telegramUserId', user.id.toString());
          
          // Добавляем префикс с ID пользователя ко всем ключам localStorage
          const prefix = `user_${user.id}_`;
          
          // Перемещаем существующие данные под новый префикс
          const gameCards = localStorage.getItem('gameCards');
          const gameBalance = localStorage.getItem('gameBalance');
          const battleState = localStorage.getItem('battleState');
          const gameInventory = localStorage.getItem('gameInventory');
          
          if (gameCards) localStorage.setItem(prefix + 'gameCards', gameCards);
          if (gameBalance) localStorage.setItem(prefix + 'gameBalance', gameBalance);
          if (battleState) localStorage.setItem(prefix + 'battleState', battleState);
          if (gameInventory) localStorage.setItem(prefix + 'gameInventory', gameInventory);
          
          // Очищаем старые данные
          localStorage.removeItem('gameCards');
          localStorage.removeItem('gameBalance');
          localStorage.removeItem('battleState');
          localStorage.removeItem('gameInventory');
        }
      }
    };

    initTelegram();
  }, []);

  return { userId, userName };
};