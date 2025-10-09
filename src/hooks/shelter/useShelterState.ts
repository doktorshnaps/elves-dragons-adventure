import { useState, useEffect, useMemo } from 'react';
import { useBatchedGameState } from '@/hooks/useBatchedGameState';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { useToast } from '@/hooks/use-toast';
import { useBuildingUpgrades } from '@/hooks/useBuildingUpgrades';

export interface NestUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: {
    wood: number;
    stone: number;
    iron: number;
    balance: number;
  };
  benefit: string;
}

export interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  requirements: {
    wood?: number;
    stone?: number;
    iron?: number;
    balance?: number;
  };
  result: string;
  category: "weapon" | "armor" | "potion" | "misc";
}

export const useShelterState = () => {
  const { language } = useLanguage();
  const gameState = useBatchedGameState(); // Используем батчированную версию
  const { toast } = useToast();
  const { startUpgradeAtomic, isUpgrading, getUpgradeProgress, formatRemainingTime, installUpgrade, isUpgradeReady } = useBuildingUpgrades();
  
  const [activeTab, setActiveTab] = useState<"upgrades" | "crafting" | "barracks" | "dragonlair" | "medical" | "workers">("upgrades");
  const [balance, setBalance] = useState(gameState.balance);
  
  // Синхронизируем баланс с gameState
  useEffect(() => {
    setBalance(gameState.balance);
  }, [gameState.balance]);
  
  // Подписка на события обновления баланса
  useEffect(() => {
    const handleBalanceUpdate = (e: any) => {
      if (e.detail?.balance !== undefined) {
        setBalance(e.detail.balance);
      }
    };
    
    window.addEventListener('balanceUpdate', handleBalanceUpdate as EventListener);
    return () => window.removeEventListener('balanceUpdate', handleBalanceUpdate as EventListener);
  }, []);
  
  // Получаем активных рабочих: сначала из gameState, при пустом значении — из localStorage
  const getActiveWorkersSafe = () => {
    const fromState = Array.isArray(gameState.activeWorkers) ? gameState.activeWorkers : [];
    if (fromState.length > 0) return fromState;
    try {
      const cached = localStorage.getItem('activeWorkers');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [] as any[];
  };

  const [activeWorkersLocal, setActiveWorkersLocal] = useState<any[]>(getActiveWorkersSafe());
  
  // Обновляем локальный список при изменении данных игры
  useEffect(() => {
    setActiveWorkersLocal(getActiveWorkersSafe());
  }, [gameState.activeWorkers]);
  
  // Слушаем локальные события об изменении активных рабочих
  useEffect(() => {
    const handler = (e: any) => {
      setActiveWorkersLocal(e.detail || getActiveWorkersSafe());
    };
    window.addEventListener('activeWorkers:changed', handler as EventListener);
    return () => window.removeEventListener('activeWorkers:changed', handler as EventListener);
  }, []);
  
  const activeWorkers = activeWorkersLocal;

  // Функция для проверки, есть ли рабочие в здании
  const hasWorkersInBuilding = (buildingId: string) => {
    return activeWorkers.some(worker => {
      if (worker.building !== buildingId) return false;
      const now = Date.now();
      const endTime = worker.startTime + worker.duration;
      return now < endTime;
    });
  };

  // Функция для получения активных рабочих в здании
  const getActiveWorkersInBuilding = (buildingId: string) => {
    return activeWorkers.filter(worker => {
      if (worker.building !== buildingId) return false;
      const now = Date.now();
      const endTime = worker.startTime + worker.duration;
      return now < endTime;
    });
  };

  // Используем реальные балансы ресурсов из базы данных
  const resources = {
    wood: gameState.wood,
    stone: gameState.stone,
    iron: gameState.iron,
    gold: gameState.gold
  };

  // Получаем уровни зданий из gameState с fallback значениями
  const buildingLevels = gameState.buildingLevels || {
    main_hall: 0,
    workshop: 0,
    storage: 0,
    sawmill: 0,
    quarry: 0,
    barracks: 0,
    dragon_lair: 0,
    medical: 0
  };

  // Функция для расчета стоимости апгрейда для каждого уровня
  const getUpgradeCost = (buildingId: string, currentLevel: number) => {
    const baseCosts: Record<string, any> = {
      main_hall: { wood: 0, stone: 0, iron: 0, balance: 50 },
      workshop: { wood: 0, stone: 0, iron: 0, balance: 100 },
      storage: { wood: 0, stone: 0, iron: 0, balance: 100 },
      sawmill: { wood: 0, stone: 0, iron: 0, balance: 100 },
      quarry: { wood: 0, stone: 0, iron: 0, balance: 100 },
      barracks: { wood: 0, stone: 0, iron: 0, balance: 400 },
      dragon_lair: { wood: 0, stone: 0, iron: 0, balance: 400 },
      medical: { wood: 0, stone: 0, iron: 0, balance: 50 }
    };
    
    const baseCost = baseCosts[buildingId] || { wood: 30, stone: 20, iron: 5, balance: 50 };
    const multiplier = Math.pow(1.5, currentLevel);
    
    return {
      wood: Math.floor(baseCost.wood * multiplier),
      stone: Math.floor(baseCost.stone * multiplier),
      iron: Math.floor(baseCost.iron * multiplier),
      balance: Math.floor(baseCost.balance * multiplier)
    };
  };

  // Функция для получения времени улучшения (в минутах)
  const getUpgradeTime = (buildingId: string) => {
    const baseTimes: Record<string, number> = {
      main_hall: 5,
      storage: 10,
      workshop: 15,
      sawmill: 20,
      quarry: 25,
      barracks: 30,
      dragon_lair: 35,
      medical: 20
    };
    
    return baseTimes[buildingId] || 15;
  };

  // Функция для проверки требований для улучшения
  const canUpgradeBuilding = (buildingId: string) => {
    if (buildingId === 'storage') {
      return buildingLevels.main_hall >= 1;
    }
    return true;
  };

  const nestUpgrades: NestUpgrade[] = useMemo(() => [
    {
      id: "main_hall",
      name: t(language, 'shelter.mainHall'),
      description: t(language, 'shelter.mainHallDesc'),
      level: buildingLevels.main_hall || 0,
      maxLevel: 8,
      cost: getUpgradeCost("main_hall", buildingLevels.main_hall || 0),
      benefit: t(language, 'shelter.mainHallBenefit')
    },
    {
      id: "workshop",
      name: t(language, 'shelter.workshop'),
      description: t(language, 'shelter.workshopDesc'),
      level: buildingLevels.workshop || 0,
      maxLevel: 8,
      cost: getUpgradeCost("workshop", buildingLevels.workshop || 0),
      benefit: t(language, 'shelter.workshopBenefit')
    },
    {
      id: "storage",
      name: t(language, 'shelter.storage'),
      description: t(language, 'shelter.storageDesc'),
      level: buildingLevels.storage || 0,
      maxLevel: 8,
      cost: getUpgradeCost("storage", buildingLevels.storage || 0),
      benefit: t(language, 'shelter.storageBenefit')
    },
    {
      id: "sawmill",
      name: t(language, 'shelter.sawmill'),
      description: t(language, 'shelter.sawmillDesc'),
      level: buildingLevels.sawmill || 0,
      maxLevel: 8,
      cost: getUpgradeCost("sawmill", buildingLevels.sawmill || 0),
      benefit: t(language, 'shelter.sawmillBenefit')
    },
    {
      id: "quarry",
      name: t(language, 'shelter.quarry'),
      description: t(language, 'shelter.quarryDesc'),
      level: buildingLevels.quarry || 0,
      maxLevel: 8,
      cost: getUpgradeCost("quarry", buildingLevels.quarry || 0),
      benefit: t(language, 'shelter.quarryBenefit')
    },
    {
      id: "barracks",
      name: t(language, 'shelter.barracksBuilding'),
      description: t(language, 'shelter.barracksDesc'),
      level: buildingLevels.barracks || 0,
      maxLevel: 8,
      cost: getUpgradeCost("barracks", buildingLevels.barracks || 0),
      benefit: t(language, 'shelter.barracksBenefit')
    },
    {
      id: "dragon_lair",
      name: t(language, 'shelter.dragonLairBuilding'),
      description: t(language, 'shelter.dragonLairDesc'),
      level: buildingLevels.dragon_lair || 0,
      maxLevel: 8,
      cost: getUpgradeCost("dragon_lair", buildingLevels.dragon_lair || 0),
      benefit: t(language, 'shelter.dragonLairBenefit')
    },
    {
      id: "medical",
      name: t(language, 'shelter.medicalBuilding'),
      description: t(language, 'shelter.medicalDesc'),
      level: buildingLevels.medical || 0,
      maxLevel: 8,
      cost: getUpgradeCost("medical", buildingLevels.medical || 0),
      benefit: t(language, 'shelter.medicalBenefit')
    }
  ], [buildingLevels, language]);

  const craftRecipes: CraftRecipe[] = useMemo(() => [{
    id: "iron_sword",
    name: t(language, 'shelter.ironSword'),
    description: t(language, 'shelter.ironSwordDesc'),
    requirements: {
      iron: 15,
      wood: 5,
      balance: 50
    },
    result: t(language, 'shelter.ironSwordResult'),
    category: "weapon"
  }, {
    id: "leather_armor",
    name: t(language, 'shelter.leatherArmor'),
    description: t(language, 'shelter.leatherArmorDesc'),
    requirements: {
      wood: 10,
      stone: 5,
      balance: 30
    },
    result: t(language, 'shelter.leatherArmorResult'),
    category: "armor"
  }, {
    id: "health_potion",
    name: t(language, 'shelter.healthPotion'),
    description: t(language, 'shelter.healthPotionDesc'),
    requirements: {
      wood: 3,
      balance: 20
    },
    result: t(language, 'shelter.healthPotionResult'),
    category: "potion"
  }], [language]);

  const canAffordUpgrade = (upgrade: NestUpgrade) => {
    const requiresWorkers = upgrade.id !== 'main_hall' && upgrade.id !== 'storage';
    const hasRequiredWorkers = !requiresWorkers || hasWorkersInBuilding(upgrade.id);
    
    return upgrade.level < upgrade.maxLevel && 
           resources.wood >= upgrade.cost.wood && 
           resources.stone >= upgrade.cost.stone && 
           resources.iron >= upgrade.cost.iron && 
           gameState.balance >= upgrade.cost.balance &&
           canUpgradeBuilding(upgrade.id) &&
           hasRequiredWorkers;
  };
  
  const canAffordCraft = (recipe: CraftRecipe) => {
    const hasWorkshopWorkers = hasWorkersInBuilding('workshop');
    
    return (!recipe.requirements.wood || resources.wood >= recipe.requirements.wood) && 
           (!recipe.requirements.stone || resources.stone >= recipe.requirements.stone) && 
           (!recipe.requirements.iron || resources.iron >= recipe.requirements.iron) && 
           (!recipe.requirements.balance || gameState.balance >= recipe.requirements.balance) && 
           buildingLevels.workshop > 0 &&
           hasWorkshopWorkers;
  };

  const handleUpgrade = async (upgrade: NestUpgrade) => {
    // Если улучшение готово к установке, устанавливаем его
    if (isUpgradeReady(upgrade.id)) {
      installUpgrade(upgrade.id);
      return;
    }

    if (!canAffordUpgrade(upgrade) || isUpgrading(upgrade.id)) return;
    
    const newResources = {
      wood: resources.wood - upgrade.cost.wood,
      stone: resources.stone - upgrade.cost.stone,
      iron: resources.iron - upgrade.cost.iron
    };
    
    const newBalance = gameState.balance - upgrade.cost.balance;
    
    try {
      const upgradeTime = getUpgradeTime(upgrade.id);
      await startUpgradeAtomic(
        upgrade.id,
        upgradeTime,
        upgrade.level + 1,
        { ...newResources, balance: newBalance }
      );
    } catch (e) {
      console.error('❌ Failed to start upgrade atomically', e);
      return;
    }

    toast({
      title: "Улучшение начато!",
      description: `${upgrade.name} будет улучшено через ${getUpgradeTime(upgrade.id)} минут`
    });
  };

  const handleCraft = async (recipe: CraftRecipe) => {
    if (!canAffordCraft(recipe)) return;
    
    const newResources = { ...resources };
    if (recipe.requirements.wood) newResources.wood -= recipe.requirements.wood;
    if (recipe.requirements.stone) newResources.stone -= recipe.requirements.stone;
    if (recipe.requirements.iron) newResources.iron -= recipe.requirements.iron;
    
    let newBalance = gameState.balance;
    if (recipe.requirements.balance) newBalance -= recipe.requirements.balance;
    
    await gameState.actions.batchUpdate({
      ...newResources,
      balance: newBalance
    });
    
    toast({
      title: t(language, 'shelter.itemCreated'),
      description: `${t(language, 'shelter.created')} ${recipe.result}`
    });
  };

  return {
    activeTab,
    setActiveTab,
    activeWorkers,
    resources,
    buildingLevels,
    nestUpgrades,
    craftRecipes,
    canAffordUpgrade,
    canAffordCraft,
    handleUpgrade,
    handleCraft,
    hasWorkersInBuilding,
    getActiveWorkersInBuilding,
    isUpgrading,
    getUpgradeProgress,
    formatRemainingTime,
    getUpgradeTime,
    isUpgradeReady,
    balance
  };
};
