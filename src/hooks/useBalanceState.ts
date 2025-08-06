import { useState, useEffect } from 'react';
import { useGameData } from './useGameData';

export const useBalanceState = () => {
  const { gameData, updateGameData } = useGameData();
  
  const balance = gameData.balance;

  const updateBalance = async (newBalance: number) => {
    await updateGameData({ balance: newBalance });
  };

  return { balance, updateBalance };
};