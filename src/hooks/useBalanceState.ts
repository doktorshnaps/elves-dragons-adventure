import { useGameData } from './useGameData';

export const useBalanceState = () => {
  const { gameData, updateGameData } = useGameData();
  const balance = gameData.balance ?? 0;

  const updateBalance = async (newBalance: number) => {
    await updateGameData({ balance: newBalance });
  };

  return { balance, updateBalance };
};