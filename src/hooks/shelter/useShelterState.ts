import { useState, useEffect, useMemo } from 'react';
import { useBatchedGameState } from '@/hooks/useBatchedGameState';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { useToast } from '@/hooks/use-toast';
import { useBuildingUpgrades } from '@/hooks/useBuildingUpgrades';
import { useBuildingConfigs } from '@/hooks/useBuildingConfigs';
import { useItemTemplates } from '@/hooks/useItemTemplates';

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
    gold: number;
    balance: number;
    gt: number;
  };
  requiredItems: Array<{ item_id: string; quantity: number }>;
  requiredMainHallLevel: number;
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
  const { getBuildingConfig, getUpgradeCost: getUpgradeCostFromDB, loading: configsLoading } = useBuildingConfigs();
  const { getTemplate, getItemName } = useItemTemplates();
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
    // Получаем стоимость из building_configs
    const costFromDB = getUpgradeCostFromDB(buildingId, currentLevel);
    
    if (costFromDB) {
      return {
        wood: costFromDB.wood || 0,
        stone: costFromDB.stone || 0,
        iron: costFromDB.iron || 0,
        gold: costFromDB.gold || 0,
        balance: costFromDB.ell || 0, // ell = игровая валюта (balance)
        gt: costFromDB.gt || 0
      };
    }
    
    // Fallback на захардкоженные значения (на случай если БД недоступна)
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
      gold: 0,
      balance: Math.floor(baseCost.balance * multiplier),
      gt: 0
    };
  };

  // Функция для получения времени улучшения (в минутах)
  const getUpgradeTime = (buildingId: string) => {
    const currentLevel = buildingLevels[buildingId as keyof typeof buildingLevels] || 0;
    const config = getBuildingConfig(buildingId, currentLevel + 1);
    
    if (config?.upgrade_time_hours) {
      return config.upgrade_time_hours * 60; // Преобразуем часы в минуты
    }
    
    // Fallback на захардкоженные значения
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
    const currentLevel = buildingLevels[buildingId as keyof typeof buildingLevels] || 0;
    const config = getBuildingConfig(buildingId, currentLevel + 1);
    
    // Проверяем требования из building_configs
    if (config) {
      // Проверяем required_main_hall_level
      if (config.required_main_hall_level && buildingLevels.main_hall < config.required_main_hall_level) {
        return false;
      }
      
      // Проверяем required_items (если есть)
      if (config.required_items && Array.isArray(config.required_items) && config.required_items.length > 0) {
        // TODO: Проверить наличие требуемых предметов в инвентаре
        // Пока пропускаем эту проверку
      }
    }
    
    // Fallback на старую логику
    if (buildingId === 'storage') {
      return buildingLevels.main_hall >= 1;
    }
    return true;
  };

  const nestUpgrades: NestUpgrade[] = useMemo(() => {
    const createUpgrade = (buildingId: string, nameKey: string, descKey: string, benefitKey: string): NestUpgrade => {
      const currentLevel = buildingLevels[buildingId as keyof typeof buildingLevels] || 0;
      const nextLevelConfig = getBuildingConfig(buildingId, currentLevel + 1);
      const currentLevelConfig = getBuildingConfig(buildingId, currentLevel);
      
      // Формируем динамический benefit на основе данных из building_configs
      let benefit = t(language, benefitKey);
      
      // Для sawmill и quarry показываем реальную скорость производства ТЕКУЩЕГО уровня
      if ((buildingId === 'sawmill' || buildingId === 'quarry') && currentLevelConfig?.production_per_hour) {
        const resourceName = buildingId === 'sawmill' 
          ? t(language, 'resources.wood') || 'дерева'
          : t(language, 'resources.stone') || 'камня';
        benefit = `${currentLevelConfig.production_per_hour} ${resourceName} ${t(language, 'shelter.perHour') || 'в час'}`;
      }
      
      // Для storage показываем рабочие часы ТЕКУЩЕГО уровня
      if (buildingId === 'storage' && currentLevelConfig?.working_hours) {
        benefit = `${t(language, 'shelter.workingHours') || 'Рабочих часов'}: ${currentLevelConfig.working_hours}`;
      }
      
      return {
        id: buildingId,
        name: t(language, nameKey),
        description: t(language, descKey),
        level: currentLevel,
        maxLevel: 8,
        cost: getUpgradeCost(buildingId, currentLevel),
        requiredItems: nextLevelConfig?.required_items || [],
        requiredMainHallLevel: nextLevelConfig?.required_main_hall_level || 0,
        benefit
      };
    };

    return [
    createUpgrade("main_hall", 'shelter.mainHall', 'shelter.mainHallDesc', 'shelter.mainHallBenefit'),
    createUpgrade("workshop", 'shelter.workshop', 'shelter.workshopDesc', 'shelter.workshopBenefit'),
    createUpgrade("storage", 'shelter.storage', 'shelter.storageDesc', 'shelter.storageBenefit'),
    createUpgrade("sawmill", 'shelter.sawmill', 'shelter.sawmillDesc', 'shelter.sawmillBenefit'),
    createUpgrade("quarry", 'shelter.quarry', 'shelter.quarryDesc', 'shelter.quarryBenefit'),
    createUpgrade("barracks", 'shelter.barracksBuilding', 'shelter.barracksDesc', 'shelter.barracksBenefit'),
    createUpgrade("dragon_lair", 'shelter.dragonLairBuilding', 'shelter.dragonLairDesc', 'shelter.dragonLairBenefit'),
    createUpgrade("medical", 'shelter.medicalBuilding', 'shelter.medicalDesc', 'shelter.medicalBenefit')
  ];
  }, [buildingLevels, language, getBuildingConfig]);

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
    // Проверяем наличие требуемых предметов
    let hasRequiredItems = true;
    if (upgrade.requiredItems && (Array.isArray(upgrade.requiredItems) || typeof upgrade.requiredItems === 'object')) {
      const inventoryCounts: Record<string, number> = {};
      gameState.inventory.forEach(item => {
        const itemName = item.name;
        inventoryCounts[itemName] = (inventoryCounts[itemName] || 0) + 1;
      });

      const entries: Array<{ item_id: string; quantity: number }> = Array.isArray(upgrade.requiredItems)
        ? (upgrade.requiredItems as any[]).map((req: any) => ({
            item_id: String(req.item_id ?? req.id ?? req.type ?? ''),
            quantity: Number(req.quantity ?? req.qty ?? req.count ?? 1)
          }))
        : Object.entries(upgrade.requiredItems as Record<string, any>)
            .map(([key, qty]) => ({ item_id: String(key), quantity: Number(qty ?? 1) }));

      for (const req of entries) {
        const template = getTemplate(req.item_id);
        const targetName = template?.name || getItemName(req.item_id) || req.item_id;
        const playerHas = inventoryCounts[targetName] || 0;
        if (playerHas < req.quantity) {
          hasRequiredItems = false;
          break;
        }
      }
    }
    
    return upgrade.level < upgrade.maxLevel && 
           resources.wood >= upgrade.cost.wood && 
           resources.stone >= upgrade.cost.stone && 
           resources.iron >= upgrade.cost.iron && 
           gameState.balance >= upgrade.cost.balance &&
           canUpgradeBuilding(upgrade.id) &&
           hasRequiredItems;
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
    
    // Удаляем требуемые предметы из inventory (ищем по name)
    let newInventory = [...gameState.inventory];
    if (upgrade.requiredItems && (Array.isArray(upgrade.requiredItems) || typeof upgrade.requiredItems === 'object')) {
      const toRemove = new Map<string, number>();

      // Нормализуем список требуемых предметов из массива или объектной формы
      const entries: Array<{ item_id: string; quantity: number }> = Array.isArray(upgrade.requiredItems)
        ? (upgrade.requiredItems as any[]).map((req: any) => ({
            item_id: String(req.item_id ?? req.id ?? req.type ?? ''),
            quantity: Number(req.quantity ?? req.qty ?? req.count ?? 1)
          }))
        : Object.entries(upgrade.requiredItems as Record<string, any>)
            .map(([key, qty]) => ({ item_id: String(key), quantity: Number(qty ?? 1) }));

      // Считаем, сколько каких предметов по ИМЕНИ нужно удалить
      for (const req of entries) {
        const template = getTemplate(req.item_id);
        const targetName = (template?.name || getItemName(req.item_id) || req.item_id) as string;
        const prev = toRemove.get(targetName) || 0;
        toRemove.set(targetName, prev + (req.quantity || 1));
      }

      // Одним проходом удаляем РОВНО нужное кол-во экземпляров (по уникальным id), совпадающих по name
      const filtered: any[] = [];
      for (const item of newInventory) {
        const name = (item?.name ?? '') as string;
        const need = toRemove.get(name) || 0;
        if (need > 0) {
          toRemove.set(name, need - 1);
          continue; // удаляем этот экземпляр
        }
        filtered.push(item);
      }
      newInventory = filtered;
    }
    
    try {
      const upgradeTime = getUpgradeTime(upgrade.id);
      await startUpgradeAtomic(
        upgrade.id,
        upgradeTime,
        upgrade.level + 1,
        { ...newResources, balance: newBalance, inventory: newInventory }
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
