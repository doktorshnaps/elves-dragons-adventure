import { useState, useEffect } from 'react';

export const useBalanceState = () => {
  const [balance, setBalance] = useState(() => {
    const userId = localStorage.getItem('telegramUserId');
    const prefix = userId ? `user_${userId}_` : '';
    const savedBalance = localStorage.getItem(prefix + 'gameBalance');
    return savedBalance ? parseInt(savedBalance, 10) : 0;
  });

  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent<{ balance: number }>) => {
      setBalance(e.detail.balance);
      const userId = localStorage.getItem('telegramUserId');
      const prefix = userId ? `user_${userId}_` : '';
      localStorage.setItem(prefix + 'gameBalance', e.detail.balance.toString());
    };

    const handleStorageChange = (e: StorageEvent) => {
      const userId = localStorage.getItem('telegramUserId');
      const prefix = userId ? `user_${userId}_` : '';
      if (e.key === prefix + 'gameBalance') {
        const newBalance = e.newValue ? parseInt(e.newValue, 10) : 0;
        setBalance(newBalance);
      }
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
    const userId = localStorage.getItem('telegramUserId');
    const prefix = userId ? `user_${userId}_` : '';
    localStorage.setItem(prefix + 'gameBalance', newBalance.toString());
    const event = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(event);
  };

  return { balance, updateBalance };
};