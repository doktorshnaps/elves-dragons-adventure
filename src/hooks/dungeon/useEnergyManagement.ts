import { useState, useEffect } from "react";
import { getInitialEnergyState, getTimeUntilNextEnergy, EnergyState, resetEnergyToFull } from "@/utils/energyManager";

const ADMIN_WALLET = 'mr_bruts.tg';

export const useEnergyManagement = () => {
  const [energyState, setEnergyState] = useState<EnergyState>(getInitialEnergyState());
  const [timeUntilNext, setTimeUntilNext] = useState(getTimeUntilNextEnergy());

  // Автоматически устанавливаем полную энергию для админа при загрузке
  useEffect(() => {
    const accountId = localStorage.getItem('accountId');
    if (accountId === ADMIN_WALLET) {
      const currentState = getInitialEnergyState();
      // Если энергия не максимальная - сбрасываем на полную
      if (currentState.current < currentState.max) {
        console.log('🔋 Сброс энергии админа на полную:', currentState.max);
        resetEnergyToFull();
        setEnergyState(getInitialEnergyState());
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newEnergyState = getInitialEnergyState();
      setEnergyState(newEnergyState);
      setTimeUntilNext(getTimeUntilNextEnergy());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    energyState,
    timeUntilNext
  };
};