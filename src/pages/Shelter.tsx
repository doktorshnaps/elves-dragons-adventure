import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Hammer, Wrench, Package, Star, Shield, Flame, Heart, Users } from "lucide-react";
import { useUnifiedGameState } from "@/hooks/useUnifiedGameState";
import { useToast } from "@/hooks/use-toast";
import { useGameStore } from "@/stores/gameStore";
import { AccountLevelDisplay } from "@/components/game/account/AccountLevelDisplay";
import { Barracks } from "@/components/game/shelter/Barracks";
import { DragonLair } from "@/components/game/shelter/DragonLair";
import { MedicalBayComponent } from "@/components/game/medical/MedicalBayComponent";
import { WorkersManagement } from "@/components/game/shelter/WorkersManagement";
import { BuildingWorkerStatus } from "@/components/game/shelter/BuildingWorkerStatus";
import { useLanguage } from "@/hooks/useLanguage";
import { useWorkerSync } from "@/hooks/useWorkerSync";
import { t } from "@/utils/translations";
import { useState, useEffect } from "react";
import { useBuildingUpgrades } from "@/hooks/useBuildingUpgrades";

interface NestUpgrade {
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

interface CraftRecipe {
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

export const Shelter = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const gameState = useUnifiedGameState();
  
  // Синхронизируем рабочих между card_instances и inventory
  useWorkerSync();
  const {
    toast
  } = useToast();
  const {
    accountLevel,
    accountExperience
  } = useGameStore();
  const [activeTab, setActiveTab] = useState<"upgrades" | "crafting" | "barracks" | "dragonlair" | "medical" | "workers">("upgrades");
  const [workersSpeedBoost, setWorkersSpeedBoost] = useState(0);
  
  const { startUpgrade, startUpgradeAtomic, installUpgrade, getUpgradeProgress, isUpgrading, formatRemainingTime } = useBuildingUpgrades();

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

  console.log('🏠 Shelter page state:', {
    gameStateLoading: gameState.loading,
    gameStateError: gameState.error,
    activeWorkersCount: activeWorkers.length,
    activeWorkersFromGameState: gameState.activeWorkers?.length ?? 0,
    workers: activeWorkers.map((w: any) => ({ name: w.name, building: w.building, id: w.id })),
    rawGameStateActiveWorkers: gameState.activeWorkers
  });

  // Функция для проверки, есть ли рабочие в здании
  const hasWorkersInBuilding = (buildingId: string) => {
    return activeWorkers.some(worker => {
      if (worker.building !== buildingId) return false;
      const now = Date.now();
      const endTime = worker.startTime + worker.duration;
      return now < endTime; // Проверяем, что время работы не истекло
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

  // Функция для получения общего буста скорости здания
  const getBuildingSpeedBoost = (buildingId: string) => {
    const workers = getActiveWorkersInBuilding(buildingId);
    return workers.reduce((total, worker) => total + (worker.speedBoost || 0), 0);
  };

  // Функция для получения оставшегося времени работы здания
  const getBuildingRemainingTime = (buildingId: string) => {
    const workers = getActiveWorkersInBuilding(buildingId);
    if (workers.length === 0) return 0;
    
    const now = Date.now();
    const maxEndTime = Math.max(...workers.map(worker => worker.startTime + worker.duration));
    return Math.max(0, maxEndTime - now);
  };

  // Функция для форматирования времени
  const formatTime = (milliseconds: number) => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  // Функция для проверки, активно ли здание
  const isBuildingActive = (buildingId: string) => {
    return hasWorkersInBuilding(buildingId);
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
    const baseCosts = {
      main_hall: { wood: 0, stone: 0, iron: 0, balance: 50 }, // Только ELL
      workshop: { wood: 40, stone: 25, iron: 10, balance: 80 },
      storage: { wood: 0, stone: 0, iron: 0, balance: 100 }, // Только ELL + требует главный зал
      sawmill: { wood: 25, stone: 15, iron: 3, balance: 40 },
      quarry: { wood: 20, stone: 30, iron: 5, balance: 60 },
      barracks: { wood: 50, stone: 40, iron: 15, balance: 120 },
      dragon_lair: { wood: 60, stone: 30, iron: 20, balance: 160 },
      medical: { wood: 35, stone: 45, iron: 12, balance: 100 }
    };
    
    const baseCost = baseCosts[buildingId] || { wood: 30, stone: 20, iron: 5, balance: 50 };
    const multiplier = Math.pow(1.5, currentLevel); // Каждый уровень дороже в 1.5 раза
    
    return {
      wood: Math.floor(baseCost.wood * multiplier),
      stone: Math.floor(baseCost.stone * multiplier),
      iron: Math.floor(baseCost.iron * multiplier),
      balance: Math.floor(baseCost.balance * multiplier)
    };
  };

  // Функция для получения времени улучшения (в минутах)
  const getUpgradeTime = (buildingId: string) => {
    const baseTimes = {
      main_hall: 5, // 5 минут
      storage: 10, // 10 минут
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
      return buildingLevels.main_hall >= 1; // Требует 1 уровень главного зала
    }
    return true;
  };

  const nestUpgrades: NestUpgrade[] = [
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
  ];

  const craftRecipes: CraftRecipe[] = [{
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

  const canAffordUpgrade = (upgrade: NestUpgrade) => {
    return upgrade.level < upgrade.maxLevel && 
           resources.wood >= upgrade.cost.wood && 
           resources.stone >= upgrade.cost.stone && 
           resources.iron >= upgrade.cost.iron && 
           gameState.balance >= upgrade.cost.balance &&
           canUpgradeBuilding(upgrade.id);
  };
  
  const canAffordCraft = (recipe: CraftRecipe) => {
    return (!recipe.requirements.wood || resources.wood >= recipe.requirements.wood) && 
           (!recipe.requirements.stone || resources.stone >= recipe.requirements.stone) && 
           (!recipe.requirements.iron || resources.iron >= recipe.requirements.iron) && 
           (!recipe.requirements.balance || gameState.balance >= recipe.requirements.balance) && 
           buildingLevels.workshop > 0;
  };

  const handleUpgrade = async (upgrade: NestUpgrade) => {
    if (!canAffordUpgrade(upgrade) || isUpgrading(upgrade.id)) return;

    console.log('🛠️ handleUpgrade called', {
      building: upgrade.id,
      cost: upgrade.cost,
      balanceBefore: gameState.balance,
      resourcesBefore: { wood: resources.wood, stone: resources.stone, iron: resources.iron }
    });
    
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
      console.log('✅ Atomic start: resources+activeBuildingUpgrades saved');
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
    const newResources = {
      ...resources
    };
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        {/* Кнопка возврата в левом верхнем углу */}
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" onClick={() => navigate("/menu")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Объединенный блок: информация об аккаунте и ресурсы */}
        <div className="absolute top-3 right-4 z-10 w-80">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-3 mx-0 py-0 my-0 px-[12px]">
              {/* Информация об уровне аккаунта */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Уровень {accountLevel}</span>
              </div>
              
              {/* Ресурсы в одну строку */}
              <div className="flex justify-between gap-2">
                <div className="text-center flex-1">
                  <div className="text-lg">🪵</div>
                  <div className="text-xs font-semibold">
                    {resources.wood}
                    {buildingLevels.storage > 0 && (
                      <span className="text-muted-foreground">/{100 * buildingLevels.storage}</span>
                    )}
                  </div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-lg">🪨</div>
                  <div className="text-xs font-semibold">
                    {resources.stone}
                    {buildingLevels.storage > 0 && (
                      <span className="text-muted-foreground">/{100 * buildingLevels.storage}</span>
                    )}
                  </div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-lg">⚙️</div>
                  <div className="text-xs font-semibold">
                    {resources.iron}
                    {buildingLevels.storage > 0 && (
                      <span className="text-muted-foreground">/{100 * buildingLevels.storage}</span>
                    )}
                  </div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-lg">💰</div>
                  <div className="text-xs font-semibold">{gameState.balance} ELL</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Заголовок по центру */}
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">{t(language, 'shelter.title')}</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          <Button variant={activeTab === "upgrades" ? "default" : "outline"} onClick={() => setActiveTab("upgrades")} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            {t(language, 'shelter.upgrades')}
          </Button>
          <Button variant={activeTab === "crafting" ? "default" : "outline"} onClick={() => setActiveTab("crafting")} className="flex items-center gap-2" disabled={buildingLevels.workshop === 0}>
            <Hammer className="w-4 h-4" />
            {t(language, 'shelter.crafting')}
            {buildingLevels.workshop === 0 && <span className="text-xs">({t(language, 'shelter.notBuilt')})</span>}
          </Button>
          <Button variant={activeTab === "barracks" ? "default" : "outline"} onClick={() => setActiveTab("barracks")} className="flex items-center gap-2" disabled={buildingLevels.barracks === 0}>
            <Shield className="w-4 h-4" />
            {t(language, 'shelter.barracks')}
            {buildingLevels.barracks === 0 && <span className="text-xs">({t(language, 'shelter.notBuilt')})</span>}
          </Button>
          <Button variant={activeTab === "dragonlair" ? "default" : "outline"} onClick={() => setActiveTab("dragonlair")} className="flex items-center gap-2" disabled={buildingLevels.dragon_lair === 0}>
            <Flame className="w-4 h-4" />
            {t(language, 'shelter.dragonLair')}
            {buildingLevels.dragon_lair === 0 && <span className="text-xs">({t(language, 'shelter.notBuilt')})</span>}
          </Button>
          <Button variant={activeTab === "medical" ? "default" : "outline"} onClick={() => setActiveTab("medical")} className="flex items-center gap-2" disabled={buildingLevels.medical === 0}>
            <Heart className="w-4 h-4" />
            {t(language, 'shelter.medical')}
            {buildingLevels.medical === 0 && <span className="text-xs">({t(language, 'shelter.notBuilt')})</span>}
          </Button>
          <Button variant={activeTab === "workers" ? "default" : "outline"} onClick={() => setActiveTab("workers")} className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t(language, 'shelter.workers')}
          </Button>
        </div>

        {/* Content based on active tab */}
        
        {/* Upgrades Tab */}
        {activeTab === "upgrades" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nestUpgrades.map(upgrade => (
              <Card key={upgrade.id} className={`relative ${upgrade.level === 0 ? 'opacity-75 border-secondary' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {upgrade.name}
                       {upgrade.level === 0 && (
                         <Badge variant="secondary" className="text-xs">
                           {t(language, 'shelter.notBuilt')}
                         </Badge>
                       )}
                    </CardTitle>
                     <Badge variant={upgrade.level > 0 ? "default" : "secondary"}>
                        {t(language, 'shelter.level')} {upgrade.level}/{upgrade.maxLevel}
                      </Badge>
                   </div>
                   <CardDescription>
                     {upgrade.description}
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-3">
                     <div className="text-sm">
                       <strong>{t(language, 'shelter.benefit')}:</strong> {upgrade.benefit}
                     </div>
                     
                      {/* Прогресс улучшения */}
                      {(() => {
                        const progress = getUpgradeProgress(upgrade.id);
                        if (progress) {
                          return (
                            progress.remainingTime === 0 ? (
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-green-600">
                                  Готово к установке: уровень {progress.targetLevel}
                                </div>
                                 <Button onClick={() => installUpgrade(upgrade.id)} className="w-full">
                                   Применить
                                 </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-blue-600">
                                  Улучшается до уровня {progress.targetLevel}...
                                </div>
                                <Progress value={progress.progress} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                  Осталось: {formatRemainingTime(progress.remainingTime)}
                                </div>
                              </div>
                            )
                          );
                        }
                        return null;
                      })()}
                      
                      {upgrade.level < upgrade.maxLevel && !isUpgrading(upgrade.id) && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">{t(language, 'shelter.upgradeCost')}:</div>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <span>🪵</span>
                              <span className={resources.wood >= upgrade.cost.wood ? 'text-green-600' : 'text-red-600'}>
                                {upgrade.cost.wood}
                              </span>
                            </div>
                           <div className="flex items-center gap-1">
                             <span>🪨</span>
                             <span className={resources.stone >= upgrade.cost.stone ? 'text-green-600' : 'text-red-600'}>
                               {upgrade.cost.stone}
                             </span>
                           </div>
                           <div className="flex items-center gap-1">
                             <span>⚙️</span>
                             <span className={resources.iron >= upgrade.cost.iron ? 'text-green-600' : 'text-red-600'}>
                               {upgrade.cost.iron}
                             </span>
                           </div>
                            <div className="flex items-center gap-1">
                              <span>💰</span>
                              <span className={gameState.balance >= upgrade.cost.balance ? 'text-green-600' : 'text-red-600'}>
                                {upgrade.cost.balance} ELL
                              </span>
                            </div>
                         </div>
                          {/* Показываем время улучшения */}
                          <div className="text-xs text-muted-foreground">
                            Время улучшения: {getUpgradeTime(upgrade.id)} минут
                          </div>
                          
                          {/* Показываем требования */}
                          {upgrade.id === 'storage' && buildingLevels.main_hall < 1 && (
                            <div className="text-xs text-red-600">
                              Требуется: Главный зал 1 уровня
                            </div>
                          )}
                          
                           <Button 
                             onClick={() => handleUpgrade(upgrade)} 
                             disabled={!canAffordUpgrade(upgrade)}
                             className="w-full"
                           >
                             Построить
                           </Button>
                       </div>
                     )}
                     
                     {upgrade.level === upgrade.maxLevel && (
                       <div className="text-center py-2">
                         <Badge variant="default" className="text-sm">
                           {t(language, 'shelter.maxLevel')}
                         </Badge>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}

        {/* Crafting Tab */}
        {activeTab === "crafting" && (buildingLevels.workshop > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {craftRecipes.map(recipe => (
              <Card key={recipe.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    <Badge variant="outline">{recipe.category}</Badge>
                  </div>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <strong>{t(language, 'shelter.result')}:</strong> {recipe.result}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t(language, 'shelter.requirements')}:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {recipe.requirements.wood && (
                        <div className={resources.wood >= recipe.requirements.wood ? "text-green-600" : "text-red-600"}>
                          🪵 {recipe.requirements.wood}
                        </div>
                      )}
                      {recipe.requirements.stone && (
                        <div className={resources.stone >= recipe.requirements.stone ? "text-green-600" : "text-red-600"}>
                          🪨 {recipe.requirements.stone}
                        </div>
                      )}
                       {recipe.requirements.iron && (
                         <div className={resources.iron >= recipe.requirements.iron ? "text-green-600" : "text-red-600"}>
                           ⚙️ {recipe.requirements.iron}
                         </div>
                       )}
                       {recipe.requirements.balance && (
                         <div className={gameState.balance >= recipe.requirements.balance ? "text-green-600" : "text-red-600"}>
                           💰 {recipe.requirements.balance} ELL
                         </div>
                       )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleCraft(recipe)} 
                    disabled={!canAffordCraft(recipe)}
                    className="w-full"
                  >
                    {t(language, 'shelter.craft')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {t(language, 'shelter.workshopRequired')}
            </p>
          </div>
        ))}

        {/* Barracks Tab */}
        {activeTab === "barracks" && buildingLevels.barracks > 0 && (
          <Barracks 
            barracksLevel={buildingLevels.barracks} 
            onUpgradeBuilding={() => {/* handled by upgrades tab */}} 
          />
        )}

        {/* Dragon Lair Tab */}
        {activeTab === "dragonlair" && buildingLevels.dragon_lair > 0 && (
          <DragonLair 
            lairLevel={buildingLevels.dragon_lair} 
            onUpgradeBuilding={() => {/* handled by upgrades tab */}} 
          />
        )}

        {/* Medical Tab */}
        {activeTab === "medical" && buildingLevels.medical > 0 && (
          <MedicalBayComponent />
        )}

        {/* Workers Tab */}
        {activeTab === "workers" && (
          <WorkersManagement />
        )}
      </div>
    </div>
  );
};