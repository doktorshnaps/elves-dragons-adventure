import { useState, useEffect } from 'react';
import { useGameData } from './useGameData';
import { useWallet } from './useWallet';

export const useBalanceState = () => {
  const { gameData, updateGameData } = useGameData();
  const { accountId, isConnected } = useWallet();
  const [localBalance, setLocalBalance] = useState<number>(0);
  
  // Обновляем локальный баланс при изменении данных игры
  useEffect(() => {
    if (gameData.balance !== undefined) {
      setLocalBalance(gameData.balance);
    }
  }, [gameData.balance]);

  const balance = localBalance || gameData.balance;

  const updateBalance = async (newBalance: number) => {
    setLocalBalance(newBalance);
    await updateGameData({ balance: newBalance });
  };

  return { balance, updateBalance };
};