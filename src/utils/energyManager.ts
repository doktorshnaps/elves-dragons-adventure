export interface EnergyState {
  current: number;
  max: number;
  lastUsed: number;
  lastRegenerated: number;
}

const ENERGY_STORAGE_KEY = 'dungeonEnergy';
const MAX_ENERGY = 10;
const ADMIN_MAX_ENERGY = 1000;
const ADMIN_WALLET = 'mr_bruts.tg';
const REGEN_TIME_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

const getMaxEnergy = (): number => {
  try {
    const accountId = localStorage.getItem('walletAccountId');
    return accountId === ADMIN_WALLET ? ADMIN_MAX_ENERGY : MAX_ENERGY;
  } catch {
    return MAX_ENERGY;
  }
};

export const getInitialEnergyState = (): EnergyState => {
  const maxEnergy = getMaxEnergy();
  const savedEnergy = localStorage.getItem(ENERGY_STORAGE_KEY);
  
  if (savedEnergy) {
    const parsed = JSON.parse(savedEnergy);
    const now = Date.now();
    const timeSinceLastRegen = now - parsed.lastRegenerated;
    const regeneratedAmount = Math.floor(timeSinceLastRegen / REGEN_TIME_MS);
    
    if (regeneratedAmount > 0) {
      const newEnergy = Math.min(parsed.current + regeneratedAmount, maxEnergy);
      const newState = {
        current: newEnergy,
        max: maxEnergy,
        lastUsed: parsed.lastUsed,
        lastRegenerated: now - (timeSinceLastRegen % REGEN_TIME_MS)
      };
      localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    }
    
    // Обновляем max на случай смены аккаунта
    return {
      ...parsed,
      max: maxEnergy,
      current: Math.min(parsed.current, maxEnergy)
    };
  }
  
  const initialState = {
    current: maxEnergy,
    max: maxEnergy,
    lastUsed: 0,
    lastRegenerated: Date.now()
  };
  localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
};

export const useEnergy = (): boolean => {
  const energyState = getInitialEnergyState();
  if (energyState.current <= 0) return false;
  
  const newState = {
    ...energyState,
    current: energyState.current - 1,
    lastUsed: Date.now()
  };
  localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(newState));
  return true;
};

export const getTimeUntilNextEnergy = (): number => {
  const energyState = getInitialEnergyState();
  const maxEnergy = getMaxEnergy();
  if (energyState.current >= maxEnergy) return 0;
  
  const now = Date.now();
  const nextRegenTime = energyState.lastRegenerated + REGEN_TIME_MS;
  return Math.max(0, nextRegenTime - now);
};

// Функция для сброса и установки полной энергии (для админа)
export const resetEnergyToFull = (): void => {
  const maxEnergy = getMaxEnergy();
  const fullEnergyState = {
    current: maxEnergy,
    max: maxEnergy,
    lastUsed: 0,
    lastRegenerated: Date.now()
  };
  localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(fullEnergyState));
  console.log(`✅ Энергия сброшена на полную: ${maxEnergy}/${maxEnergy}`);
};