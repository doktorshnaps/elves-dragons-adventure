import { useState, useEffect } from "react";
import { getInitialEnergyState, getTimeUntilNextEnergy, EnergyState } from "@/utils/energyManager";

export const useEnergyManagement = () => {
  const [energyState, setEnergyState] = useState<EnergyState>(getInitialEnergyState());
  const [timeUntilNext, setTimeUntilNext] = useState(getTimeUntilNextEnergy());

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