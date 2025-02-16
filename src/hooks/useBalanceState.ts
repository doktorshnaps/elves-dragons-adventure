import { useState, useEffect } from 'react';

export const useBalanceState = () => {
  const [balance, setBalance] = useState(() => {
    const savedBalance = localStorage.getItem('gameBalance');
    return savedBalance ? parseInt(savedBalance, 10) : 0;
  });

  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent<{ balance: number }>) => {
      setBalance(e.detail.balance);
      localStorage.setItem('gameBalance', e.detail.balance.toString());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gameBalance') {
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
    localStorage.setItem('gameBalance', newBalance.toString());
    const event = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(event);
  };

  return { balance, updateBalance };
};