export interface EnergyState {
  current: number;
  max: number;
  lastUsed: number;
  lastRegenerated: number;
}

const ENERGY_STORAGE_KEY = 'dungeonEnergy';
const MAX_ENERGY = 10;
const REGEN_TIME_MS = 6 * 60 * 1000; // 6 minutes in milliseconds

export const getInitialEnergyState = (): EnergyState => {
  const savedEnergy = localStorage.getItem(ENERGY_STORAGE_KEY);
  if (savedEnergy) {
    const parsed = JSON.parse(savedEnergy);
    const now = Date.now();
    const timeSinceLastRegen = now - parsed.lastRegenerated;
    const regeneratedAmount = Math.floor(timeSinceLastRegen / REGEN_TIME_MS);
    
    if (regeneratedAmount > 0) {
      const newEnergy = Math.min(parsed.current + regeneratedAmount, MAX_ENERGY);
      const newState = {
        current: newEnergy,
        max: MAX_ENERGY,
        lastUsed: parsed.lastUsed,
        lastRegenerated: now - (timeSinceLastRegen % REGEN_TIME_MS)
      };
      localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    }
    return parsed;
  }
  
  const initialState = {
    current: MAX_ENERGY,
    max: MAX_ENERGY,
    lastUsed: 0,
    lastRegenerated: Date.now()
  };
  localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
};

export const useEnergy = () => {
  const [energyState, setEnergyState] = React.useState<EnergyState>(getInitialEnergyState());
  const [timeUntilNext, setTimeUntilNext] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newState = getInitialEnergyState();
      setEnergyState(newState);
      
      const now = Date.now();
      const nextRegenTime = newState.lastRegenerated + REGEN_TIME_MS;
      setTimeUntilNext(Math.max(0, nextRegenTime - now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const useEnergyPoint = (): boolean => {
    if (energyState.current <= 0) return false;
    
    const newState = {
      ...energyState,
      current: energyState.current - 1,
      lastUsed: Date.now()
    };
    localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(newState));
    setEnergyState(newState);
    return true;
  };

  return {
    energyState,
    timeUntilNext,
    useEnergyPoint
  };
};