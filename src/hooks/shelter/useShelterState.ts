import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBatchedGameState } from '@/hooks/useBatchedGameState';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { useToast } from '@/hooks/use-toast';
import { useBuildingUpgrades } from '@/hooks/useBuildingUpgrades';
import { useBuildingConfigs } from '@/hooks/useBuildingConfigs';
import { useItemTemplates } from '@/hooks/useItemTemplates';
import { useItemInstances } from '@/hooks/useItemInstances';
import { useGameStore } from '@/stores/gameStore';
import { resolveItemKey } from '@/utils/itemNames';
import { useCraftingRecipes } from '@/hooks/useCraftingRecipes';
import { useAddItemToInstances } from '@/hooks/useAddItemToInstances';
export interface NestUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: {
    wood: number;
    stone: number;
    balance: number;
    gt: number;
  };
  requiredItems: Array<{ item_id: string; quantity: number }>;
  benefit: string;
  backgroundImageUrl?: string;
}

export interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  requirements: {
    wood?: number;
    stone?: number;
    balance?: number;
    materials?: Array<{ item_id: string; quantity: number }>;
  };
  result: string;
  result_item_id?: number;
  category: "weapon" | "armor" | "potion" | "misc";
  craftingTime?: number;
}

export const useShelterState = () => {
  const { language } = useLanguage();
  const gameState = useBatchedGameState();
  const { toast } = useToast();
  const { startUpgradeAtomic, isUpgrading, getUpgradeProgress, formatRemainingTime, installUpgrade, isUpgradeReady } = useBuildingUpgrades();
  const { getBuildingConfig, getUpgradeCost: getUpgradeCostFromDB, loading: configsLoading } = useBuildingConfigs();
  const { getTemplate, getItemName, getTemplateByName } = useItemTemplates();
  const { instances, getCountsByItemId, getInstancesByItemId, removeItemInstancesByIds } = useItemInstances();
  const { recipes: craftingRecipesFromDB, loading: recipesLoading } = useCraftingRecipes();
  const { addItemsToInstances } = useAddItemToInstances();
  
  // Мемоизируем счётчики предметов для передачи в компоненты
  const inventoryCounts = useMemo(() => {
    return getCountsByItemId();
  }, [getCountsByItemId]);
  const [activeTab, setActiveTab] = useState<"upgrades" | "crafting" | "barracks" | "dragonlair" | "medical" | "workers">("upgrades");
  const [balance, setBalance] = useState(gameState.balance);
  // Синхронизируем баланс с gameState
  useEffect(() => {
    setBalance(gameState.balance);
  }, [gameState.balance]);
  
  // inventory теперь управляется через item_instances
  const { instances: effectiveInventory } = useItemInstances();
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
  const [workersLoaded, setWorkersLoaded] = useState(false);
  
  // Загрузка рабочих при монтировании
  useEffect(() => {
    const workers = getActiveWorkersSafe();
    setActiveWorkersLocal(workers);
    // Даём небольшую задержку чтобы убедиться что данные загружены
    const timeout = setTimeout(() => {
      setWorkersLoaded(true);
    }, 100);
    return () => clearTimeout(timeout);
  }, []);
  
  // Обновляем локальный список при изменении данных игры
  useEffect(() => {
    const workers = getActiveWorkersSafe();
    setActiveWorkersLocal(workers);
    setWorkersLoaded(true);
  }, [gameState.activeWorkers]);
  
  // Слушаем локальные события об изменении активных рабочих
  useEffect(() => {
    const handler = (e: any) => {
      setActiveWorkersLocal(e.detail || getActiveWorkersSafe());
      setWorkersLoaded(true);
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

  // Унифицированное определение ключа предмета для сопоставления через item_id из шаблона
  const getItemMatchKey = (item: any): string => {
    // Сначала пытаемся найти шаблон по имени предмета
    const templateByName = getTemplateByName(item?.name);
    if (templateByName?.item_id) {
      return templateByName.item_id;
    }
    
    // Если не нашли по имени, пробуем по типу через resolveItemKey
    const typeKey = resolveItemKey(String(item?.type ?? ''));
    if (typeKey && typeKey !== 'material') {
      return typeKey;
    }
    
    // Запасной вариант - имя через resolveItemKey
    return resolveItemKey(String(item?.name ?? ''));
  };

  // Используем реальные балансы ресурсов из базы данных
  const resources = {
    wood: gameState.wood,
    stone: gameState.stone
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
        balance: costFromDB.ell || 0, // ell = игровая валюта (balance)
        gt: costFromDB.gt || 0
      };
    }
    
    // Fallback на захардкоженные значения (на случай если БД недоступна)
    const baseCosts: Record<string, any> = {
      main_hall: { wood: 0, stone: 0, balance: 50 },
      workshop: { wood: 0, stone: 0, balance: 100 },
      storage: { wood: 0, stone: 0, balance: 100 },
      sawmill: { wood: 0, stone: 0, balance: 100 },
      quarry: { wood: 0, stone: 0, balance: 100 },
      barracks: { wood: 0, stone: 0, balance: 400 },
      dragon_lair: { wood: 0, stone: 0, balance: 400 },
      medical: { wood: 0, stone: 0, balance: 50 }
    };
    
    const baseCost = baseCosts[buildingId] || { wood: 30, stone: 20, balance: 50 };
    const multiplier = Math.pow(1.5, currentLevel);
    
    return {
      wood: Math.floor(baseCost.wood * multiplier),
      stone: Math.floor(baseCost.stone * multiplier),
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

  // Функция для проверки требований для улучшения (убрана проверка required_main_hall_level)
  const canUpgradeBuilding = (buildingId: string) => {
    // Все требования теперь проверяются только через required_items в админ панели
    // Скрытые автоматические проверки удалены
    
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
        benefit,
        backgroundImageUrl: currentLevelConfig?.background_image_url || nextLevelConfig?.background_image_url
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

  const craftRecipes: CraftRecipe[] = useMemo(() => {
    if (recipesLoading || craftingRecipesFromDB.length === 0) {
      // Fallback на старые рецепты пока грузятся данные
      return [{
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
  }];
    }
    
    // Преобразуем рецепты из БД в формат CraftRecipe
    return craftingRecipesFromDB.map(recipe => {
      const resultTemplate = getTemplate(String(recipe.result_item_id));
      
      // Преобразуем и валидируем required_materials
      const materials = (recipe.required_materials || [])
        .filter(mat => mat && (mat.item_id !== undefined && mat.item_id !== null))
        .map(mat => ({
          item_id: String(mat.item_id), // Всегда преобразуем в строку
          quantity: mat.quantity || 1
        }));
      
      return {
        id: recipe.id,
        name: recipe.recipe_name,
        description: recipe.description || '',
        requirements: {
          balance: 0, // В БД нет стоимости ELL для крафта, можно добавить позже
          materials: materials
        },
        result: resultTemplate?.name || 'Неизвестный предмет',
        result_item_id: recipe.result_item_id,
        category: (recipe.category as any) || 'misc',
        craftingTime: recipe.crafting_time_hours || 1
      };
    });
  }, [language, craftingRecipesFromDB, recipesLoading, getTemplate]);

  const canAffordUpgrade = useCallback((upgrade: NestUpgrade) => {
    // Проверяем наличие требуемых предметов по item_id из item_instances
    let hasRequiredItems = true;
    if (upgrade.requiredItems && (Array.isArray(upgrade.requiredItems) || typeof upgrade.requiredItems === 'object')) {
      const instanceCounts = inventoryCounts;

      // Normalize required items
      const rawEntries: Array<{ item_id: string; quantity: number }> = Array.isArray(upgrade.requiredItems)
        ? (upgrade.requiredItems as any[]).map((req: any) => ({
            item_id: String(req.item_id ?? req.id ?? req.type ?? ''),
            quantity: Number(req.quantity ?? req.qty ?? req.count ?? 1)
          }))
        : Object.entries(upgrade.requiredItems as Record<string, any>)
            .map(([key, qty]) => ({ item_id: String(key), quantity: Number(qty ?? 1) }));

      // Dedupe by real item_id from template - СУММИРУЕМ количества для одинаковых item_id
      const dedupMap = new Map<string, number>();
      for (const r of rawEntries) {
        const tpl = getTemplate(r.item_id);
        const key = tpl?.item_id ?? String(r.item_id);
        const prev = dedupMap.get(key) || 0;
        dedupMap.set(key, prev + Number(r.quantity || 1)); // СУММА, не max!
      }
      const entries = Array.from(dedupMap, ([item_id, quantity]) => ({ item_id, quantity }));

      for (const req of entries) {
        const playerHas = instanceCounts[req.item_id] || 0;
        if (playerHas < req.quantity) {
          hasRequiredItems = false;
          break;
        }
      }
    }
    
    const levelOk = upgrade.level < upgrade.maxLevel;
    const woodOk = resources.wood >= (upgrade.cost.wood || 0);
    const stoneOk = resources.stone >= (upgrade.cost.stone || 0);
    const balanceOk = gameState.balance >= (upgrade.cost.balance || 0);
    const mhOk = canUpgradeBuilding(upgrade.id);

    return levelOk && woodOk && stoneOk && balanceOk && mhOk && hasRequiredItems;
  }, [inventoryCounts, resources, gameState.balance, getTemplate, canUpgradeBuilding]);
  
  const canAffordCraft = (recipe: CraftRecipe) => {
    const hasWorkshopWorkers = hasWorkersInBuilding('workshop');
    
    // Проверка базовых ресурсов
    const basicResourcesCheck = 
      (!recipe.requirements.wood || resources.wood >= recipe.requirements.wood) && 
      (!recipe.requirements.stone || resources.stone >= recipe.requirements.stone) && 
      (!recipe.requirements.balance || gameState.balance >= recipe.requirements.balance);
    
    // Проверка требуемых материалов
    let hasMaterials = true;
    if (recipe.requirements.materials && recipe.requirements.materials.length > 0) {
      for (const mat of recipe.requirements.materials) {
        const count = inventoryCounts[mat.item_id] || 0;
        if (count < mat.quantity) {
          hasMaterials = false;
          break;
        }
      }
    }
    
    return basicResourcesCheck && 
           buildingLevels.workshop > 0 &&
           hasWorkshopWorkers &&
           hasMaterials;
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
      stone: resources.stone - upgrade.cost.stone
    };
    
    const newBalance = gameState.balance - upgrade.cost.balance;
    
    // Удаляем требуемые предметы из item_instances (по UUID)
    if (upgrade.requiredItems && (Array.isArray(upgrade.requiredItems) || typeof upgrade.requiredItems === 'object')) {
      const rawEntries: Array<{ item_id: string; quantity: number }> = Array.isArray(upgrade.requiredItems)
        ? (upgrade.requiredItems as any[]).map((req: any) => ({
            item_id: String(req.item_id ?? req.id ?? req.type ?? ''),
            quantity: Number(req.quantity ?? req.qty ?? req.count ?? 1)
          }))
        : Object.entries(upgrade.requiredItems as Record<string, any>)
            .map(([key, qty]) => ({ item_id: String(key), quantity: Number(qty ?? 1) }));

      // Dedupe by real item_id from template - СУММИРУЕМ количества для одинаковых item_id
      const dedupMap = new Map<string, number>();
      for (const r of rawEntries) {
        const tpl = getTemplate(r.item_id);
        const key = tpl?.item_id ?? String(r.item_id);
        const prev = dedupMap.get(key) || 0;
        dedupMap.set(key, prev + Number(r.quantity || 1)); // СУММА, не max!
      }
      const entries = Array.from(dedupMap, ([item_id, quantity]) => ({ item_id, quantity }));
      console.log('🧪 [upgrade] Deduped required entries to remove:', entries);

      // 1) Собираем UUID инстансов для удаления
      const idsToRemove: string[] = [];

      for (const req of entries) {
        const tpl = getTemplate(req.item_id);
        const itemId = tpl?.item_id ?? String(req.item_id);
        const available = getInstancesByItemId(itemId);
        console.log('🧪 [upgrade] Available instances for', itemId, ':', available.length, available.map(i => i.id));
        
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        const take = Math.min(Number(req.quantity || 1), shuffled.length);
        console.log(`🧪 [upgrade] Taking ${take} out of ${shuffled.length} instances for ${itemId}`);
        for (let i = 0; i < take; i++) {
          console.log(`🧪 [upgrade] Adding to remove list: ${shuffled[i].id}`);
          idsToRemove.push(shuffled[i].id);
        }
      }

      console.log('🧪 [upgrade] Total instance IDs to remove:', idsToRemove.length, idsToRemove);
      
      if (idsToRemove.length > 0) {
        try {
          console.log('🚀 [upgrade] Calling removeItemInstancesByIds with:', idsToRemove);
          await removeItemInstancesByIds(idsToRemove);
          console.log('✅ [upgrade] Successfully removed instances from DB');
        } catch (error) {
          console.error('❌ [upgrade] Failed to remove item instances:', error);
          toast({
            title: "Ошибка удаления предметов",
            description: "Не удалось удалить предметы из базы данных",
            variant: "destructive"
          });
          return; // Прерываем выполнение, чтобы не начинать улучшение
        }
      } else {
        console.log('⚠️ [upgrade] No instance IDs to remove - this might be an error!');
      }
    }
    
    try {
      const upgradeTime = getUpgradeTime(upgrade.id);
      await startUpgradeAtomic(
        upgrade.id,
        upgradeTime,
        upgrade.level + 1,
        { ...newResources, balance: newBalance }
        // inventory removed: use item_instances table instead
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
    const dbRecipe = craftingRecipesFromDB.find(r => r.id === recipe.id);
    if (!dbRecipe) {
      toast({
        title: t(language, 'error'),
        description: 'Рецепт не найден',
        variant: 'destructive'
      });
      return;
    }

    const missingMaterials: string[] = [];
    const itemsToRemove: string[] = [];
    
    dbRecipe.required_materials?.forEach((mat: any) => {
      const count = inventoryCounts[mat.item_id] || 0;
      if (count < mat.quantity) {
        const template = getTemplate(mat.item_id);
        missingMaterials.push(`${template?.name || mat.item_id}: ${mat.quantity - count}`);
      } else {
        const instances = getInstancesByItemId(mat.item_id);
        itemsToRemove.push(...instances.slice(0, mat.quantity).map(i => i.id));
      }
    });

    if (missingMaterials.length > 0) {
      toast({
        title: t(language, 'error'),
        description: `Недостаточно: ${missingMaterials.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Удаляем материалы
    if (itemsToRemove.length > 0) {
      await removeItemInstancesByIds(itemsToRemove);
    }

    // Добавляем крафт в очередь с таймером
    const craftingTimeMs = (dbRecipe.crafting_time_hours || 1) * 60 * 60 * 1000;
    const now = Date.now();
    const newWorker = {
      id: `craft_${Date.now()}_${Math.random()}`,
      building: 'workshop',
      startTime: now,
      duration: craftingTimeMs,
      task: 'crafting',
      recipeId: recipe.id,
      resultItemId: dbRecipe.result_item_id,
      resultQuantity: dbRecipe.result_quantity
    };

    const updatedWorkers = [...activeWorkers, newWorker];
    
    // Сохраняем в localStorage для быстрой синхронизации
    try {
      localStorage.setItem('activeWorkers', JSON.stringify(updatedWorkers));
      window.dispatchEvent(new CustomEvent('activeWorkers:changed', { detail: updatedWorkers }));
    } catch (e) {
      console.error('Failed to save crafting worker to localStorage', e);
    }

    // КРИТИЧНО: Сохраняем в базу данных через gameState
    try {
      await gameState.actions.batchUpdate({ activeWorkers: updatedWorkers });
      console.log('✅ Crafting worker saved to database');
    } catch (e) {
      console.error('❌ Failed to save crafting worker to database', e);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить крафт в базу данных",
        variant: "destructive"
      });
      return;
    }

    const resultTemplate = getTemplate(String(dbRecipe.result_item_id));
    toast({
      title: t(language, 'shelter.craftingStarted') || 'Крафт начат',
      description: `${resultTemplate?.name || 'Предмет'} будет готов через ${dbRecipe.crafting_time_hours || 1}ч`,
    });
  };

  // Добавляем useEffect для проверки и завершения готовых крафтов
  useEffect(() => {
    const checkCraftingCompletion = async () => {
      const now = Date.now();
      const completedCrafts = activeWorkers.filter(
        w => w.task === 'crafting' && w.building === 'workshop' && now >= w.startTime + w.duration
      );
      
      if (completedCrafts.length > 0) {
        console.log(`✅ Completing ${completedCrafts.length} crafting tasks`);
        
        for (const craft of completedCrafts) {
          const resultTemplate = getTemplate(String(craft.resultItemId));
          if (resultTemplate) {
            await addItemsToInstances(
              Array(craft.resultQuantity || 1).fill({
                template_id: craft.resultItemId,
                item_id: resultTemplate.item_id,
                name: resultTemplate.name,
                type: resultTemplate.type
              })
            );
            
            toast({
              title: t(language, 'shelter.craftingCompleted') || 'Крафт завершен',
              description: `${resultTemplate.name} x${craft.resultQuantity || 1} готов!`,
            });
          }
        }
        
        const updatedWorkers = activeWorkers.filter(
          w => !(w.task === 'crafting' && w.building === 'workshop' && now >= w.startTime + w.duration)
        );
        
        // Сохраняем в localStorage
        try {
          localStorage.setItem('activeWorkers', JSON.stringify(updatedWorkers));
          window.dispatchEvent(new CustomEvent('activeWorkers:changed', { detail: updatedWorkers }));
        } catch (e) {
          console.error('Failed to update localStorage', e);
        }
        
        // КРИТИЧНО: Обновляем в базе данных
        try {
          await gameState.actions.batchUpdate({ activeWorkers: updatedWorkers });
          console.log('✅ Completed crafts removed from database');
        } catch (e) {
          console.error('❌ Failed to update database after craft completion', e);
        }
      }
    };
    
    const interval = setInterval(checkCraftingCompletion, 1000);
    return () => clearInterval(interval);
  }, [activeWorkers, getTemplate, addItemsToInstances, gameState.actions, toast, language]);

  return {
    activeTab,
    setActiveTab,
    activeWorkers,
    workersLoaded,
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
    balance,
    inventoryCounts,
    gameLoaded: !gameState.loading
  };
};
