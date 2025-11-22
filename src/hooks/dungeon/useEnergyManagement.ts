import { useState, useEffect } from "react";
import { getInitialEnergyState, getTimeUntilNextEnergy, EnergyState, resetEnergyToFull } from "@/utils/energyManager";
import { useWalletContext } from "@/contexts/WalletConnectContext";

const ADMIN_WALLET = 'mr_bruts.tg';

export const useEnergyManagement = () => {
  const [energyState, setEnergyState] = useState<EnergyState>(getInitialEnergyState());
  const [timeUntilNext, setTimeUntilNext] = useState(getTimeUntilNextEnergy());
  const { accountId } = useWalletContext();

  // Автоматически устанавливаем полную энергию для админа при загрузке/смене аккаунта
  useEffect(() => {
    if (accountId === ADMIN_WALLET) {
      const currentState = getInitialEnergyState();
      // Если энергия не максимальная или max не 1000 — сбрасываем на полную
      if (currentState.current < currentState.max || currentState.max !== 1000) {
        console.log('🔋 Сброс энергии админа на полную:', 1000);
        resetEnergyToFull();
        setEnergyState(getInitialEnergyState());
        setTimeUntilNext(getTimeUntilNextEnergy());
      }
    }
  }, [accountId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newEnergyState = getInitialEnergyState();
      const newTimeUntilNext = getTimeUntilNextEnergy();
      
      // Обновляем только если реально изменилось
      setEnergyState(prev => {
        if (prev.current !== newEnergyState.current || 
            prev.max !== newEnergyState.max ||
            prev.lastUsed !== newEnergyState.lastUsed ||
            prev.lastRegenerated !== newEnergyState.lastRegenerated) {
          return newEnergyState;
        }
        return prev;
      });
      
      setTimeUntilNext(prev => {
        if (prev !== newTimeUntilNext) {
          return newTimeUntilNext;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    energyState,
    timeUntilNext
  };
};