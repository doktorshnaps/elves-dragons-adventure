import { useState, useEffect } from "react";
import { getInitialEnergyState, EnergyState } from "@/utils/energyManager";

export const useEnergyManagement = () => {
  const [energyState, setEnergyState] = useState<EnergyState>(getInitialEnergyState());
  const [timeUntilNext, setTimeUntilNext] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newEnergyState = getInitialEnergyState();
      setEnergyState(newEnergyState);
      
      const now = Date.now();
      const nextRegenTime = newEnergyState.lastRegenerated + (6 * 60 * 1000); // 6 minutes in milliseconds
      setTimeUntilNext(Math.max(0, nextRegenTime - now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    energyState,
    timeUntilNext
  };
};