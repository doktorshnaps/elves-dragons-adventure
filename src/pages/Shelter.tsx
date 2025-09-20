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
import { t } from "@/utils/translations";
import { useState } from "react";
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
    gold: number;
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
    gold?: number;
  };
  result: string;
  category: "weapon" | "armor" | "potion" | "misc";
}
export const Shelter = () => {
  const navigate = useNavigate();
  const {
    language
  } = useLanguage();
  const gameState = useUnifiedGameState();
  const {
    toast
  } = useToast();
  const {
    accountLevel,
    accountExperience
  } = useGameStore();
  const [activeTab, setActiveTab] = useState<"upgrades" | "crafting" | "barracks" | "dragonlair" | "medical" | "workers">("upgrades");
  const [workersSpeedBoost, setWorkersSpeedBoost] = useState(0);

  // Получаем активных рабочих из gameState
  const activeWorkers = gameState.activeWorkers || [];

  // Функция для проверки, есть ли рабочие в здании
  const hasWorkersInBuilding = (buildingId: string) => {
    return activeWorkers.some(worker => {
      if (worker.building !== buildingId) return false;
      const now = Date.now();
      const elapsed = now - worker.startTime;
      return elapsed < worker.duration; // Проверяем, что время работы не истекло
    });
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
  const nestUpgrades: NestUpgrade[] = [{
    id: "main_hall",
    name: t(language, 'shelter.mainHall'),
    description: t(language, 'shelter.mainHallDesc'),
    level: 1,
    maxLevel: 10,
    cost: {
      wood: 50,
      stone: 30,
      iron: 0,
      gold: 100
    },
    benefit: t(language, 'shelter.mainHallBenefit')
  }, {
    id: "workshop",
    name: t(language, 'shelter.workshop'),
    description: t(language, 'shelter.workshopDesc'),
    level: 0,
    maxLevel: 5,
    cost: {
      wood: 80,
      stone: 40,
      iron: 20,
      gold: 200
    },
    benefit: t(language, 'shelter.workshopBenefit')
  }, {
    id: "storage",
    name: t(language, 'shelter.storage'),
    description: t(language, 'shelter.storageDesc'),
    level: 2,
    maxLevel: 8,
    cost: {
      wood: 60,
      stone: 60,
      iron: 10,
      gold: 150
    },
    benefit: t(language, 'shelter.storageBenefit')
  }, {
    id: "sawmill",
    name: t(language, 'shelter.sawmill'),
    description: t(language, 'shelter.sawmillDesc'),
    level: 0,
    maxLevel: 8,
    cost: {
      wood: 40,
      stone: 20,
      iron: 5,
      gold: 80
    },
    benefit: t(language, 'shelter.sawmillBenefit')
  }, {
    id: "quarry",
    name: t(language, 'shelter.quarry'),
    description: t(language, 'shelter.quarryDesc'),
    level: 0,
    maxLevel: 8,
    cost: {
      wood: 30,
      stone: 50,
      iron: 10,
      gold: 120
    },
    benefit: t(language, 'shelter.quarryBenefit')
  }, {
    id: "barracks",
    name: t(language, 'shelter.barracksBuilding'),
    description: t(language, 'shelter.barracksDesc'),
    level: 1,
    maxLevel: 6,
    cost: {
      wood: 100,
      stone: 80,
      iron: 30,
      gold: 300
    },
    benefit: t(language, 'shelter.barracksBenefit')
  }, {
    id: "dragon_lair",
    name: t(language, 'shelter.dragonLairBuilding'),
    description: t(language, 'shelter.dragonLairDesc'),
    level: 1,
    maxLevel: 5,
    cost: {
      wood: 120,
      stone: 60,
      iron: 40,
      gold: 400
    },
    benefit: t(language, 'shelter.dragonLairBenefit')
  }, {
    id: "medical",
    name: t(language, 'shelter.medicalBuilding'),
    description: t(language, 'shelter.medicalDesc'),
    level: 1,
    maxLevel: 4,
    cost: {
      wood: 70,
      stone: 90,
      iron: 25,
      gold: 250
    },
    benefit: t(language, 'shelter.medicalBenefit')
  }];
  const craftRecipes: CraftRecipe[] = [{
    id: "iron_sword",
    name: t(language, 'shelter.ironSword'),
    description: t(language, 'shelter.ironSwordDesc'),
    requirements: {
      iron: 15,
      wood: 5,
      gold: 50
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
      gold: 30
    },
    result: t(language, 'shelter.leatherArmorResult'),
    category: "armor"
  }, {
    id: "health_potion",
    name: t(language, 'shelter.healthPotion'),
    description: t(language, 'shelter.healthPotionDesc'),
    requirements: {
      wood: 3,
      gold: 20
    },
    result: t(language, 'shelter.healthPotionResult'),
    category: "potion"
  }];
  const canAffordUpgrade = (upgrade: NestUpgrade) => {
    return upgrade.level < upgrade.maxLevel && resources.wood >= upgrade.cost.wood && resources.stone >= upgrade.cost.stone && resources.iron >= upgrade.cost.iron && resources.gold >= upgrade.cost.gold && isBuildingActive(upgrade.id);
  };
  const canAffordCraft = (recipe: CraftRecipe) => {
    return (!recipe.requirements.wood || resources.wood >= recipe.requirements.wood) && (!recipe.requirements.stone || resources.stone >= recipe.requirements.stone) && (!recipe.requirements.iron || resources.iron >= recipe.requirements.iron) && (!recipe.requirements.gold || resources.gold >= recipe.requirements.gold) && isBuildingActive("workshop");
  };
  const handleUpgrade = async (upgrade: NestUpgrade) => {
    if (!canAffordUpgrade(upgrade)) return;
    const newResources = {
      wood: resources.wood - upgrade.cost.wood,
      stone: resources.stone - upgrade.cost.stone,
      iron: resources.iron - upgrade.cost.iron,
      gold: resources.gold - upgrade.cost.gold
    };
    await gameState.actions.updateResources(newResources);

    // Здесь должно быть обновление уровня здания
    toast({
      title: t(language, 'shelter.buildingUpgraded'),
      description: `${upgrade.name} ${t(language, 'shelter.level')} ${upgrade.level + 1}`
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
    if (recipe.requirements.gold) newResources.gold -= recipe.requirements.gold;
    await gameState.actions.updateResources(newResources);
    toast({
      title: t(language, 'shelter.itemCreated'),
      description: `${t(language, 'shelter.created')} ${recipe.result}`
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
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
            <CardContent className="p-3 py-0 my-0 px-[13px] mx-[28px]">
              {/* Информация об уровне аккаунта */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Уровень {accountLevel}</span>
              </div>
              
              {/* Ресурсы в одну строку */}
              <div className="flex justify-between gap-2">
                <div className="text-center flex-1">
                  <div className="text-lg">🪵</div>
                  <div className="text-xs font-semibold">{resources.wood}</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-lg">🪨</div>
                  <div className="text-xs font-semibold">{resources.stone}</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-lg">⚙️</div>
                  <div className="text-xs font-semibold">{resources.iron}</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-lg">💰</div>
                  <div className="text-xs font-semibold">{resources.gold}</div>
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
          <Button variant={activeTab === "crafting" ? "default" : "outline"} onClick={() => setActiveTab("crafting")} className="flex items-center gap-2" disabled={!isBuildingActive("workshop")}>
            <Hammer className="w-4 h-4" />
            {t(language, 'shelter.crafting')}
            {!isBuildingActive("workshop") && <span className="text-xs">({t(language, 'shelter.inactive')})</span>}
          </Button>
          <Button variant={activeTab === "barracks" ? "default" : "outline"} onClick={() => setActiveTab("barracks")} className="flex items-center gap-2" disabled={!isBuildingActive("barracks")}>
            <Shield className="w-4 h-4" />
            {t(language, 'shelter.barracks')}
            {!isBuildingActive("barracks") && <span className="text-xs">({t(language, 'shelter.inactive')})</span>}
          </Button>
          <Button variant={activeTab === "dragonlair" ? "default" : "outline"} onClick={() => setActiveTab("dragonlair")} className="flex items-center gap-2" disabled={!isBuildingActive("dragon_lair")}>
            <Flame className="w-4 h-4" />
            {t(language, 'shelter.dragonLair')}
            {!isBuildingActive("dragon_lair") && <span className="text-xs">({t(language, 'shelter.inactive')})</span>}
          </Button>
          <Button variant={activeTab === "medical" ? "default" : "outline"} onClick={() => setActiveTab("medical")} className="flex items-center gap-2" disabled={!isBuildingActive("medical")}>
            <Heart className="w-4 h-4" />
            {t(language, 'shelter.medical')}
            {!isBuildingActive("medical") && <span className="text-xs">({t(language, 'shelter.inactive')})</span>}
          </Button>
          <Button variant={activeTab === "workers" ? "default" : "outline"} onClick={() => setActiveTab("workers")} className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t(language, 'shelter.workers')}
          </Button>
        </div>

        {/* Content based on active tab */}
        
        {/* Upgrades Tab */}
        {activeTab === "upgrades" && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nestUpgrades.map(upgrade => <Card key={upgrade.id} className={`relative ${!isBuildingActive(upgrade.id) ? 'opacity-50 border-destructive/50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {upgrade.name}
                       {!isBuildingActive(upgrade.id) && <Badge variant="destructive" className="text-xs">
                           {t(language, 'shelter.buildingInactive')}
                         </Badge>}
                    </CardTitle>
                     <Badge variant={upgrade.level > 0 ? "default" : "secondary"}>
                       {t(language, 'shelter.level')} {upgrade.level}/{upgrade.maxLevel}
                     </Badge>
                  </div>
                  <CardDescription>
                    {upgrade.description}
                     {!isBuildingActive(upgrade.id) && <div className="mt-2 text-destructive text-sm font-medium">
                         ⚠️ {t(language, 'shelter.buildingInactive')} - {t(language, 'shelter.workersRequired')}
                       </div>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="text-sm">
                     <strong>{t(language, 'shelter.bonus')}</strong> {upgrade.benefit}
                   </div>
                  
                   <div className="space-y-2">
                     <div className="text-sm font-medium">{t(language, 'shelter.cost')}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                       {upgrade.cost.wood > 0 && <div className={resources.wood >= upgrade.cost.wood ? "text-green-600" : "text-red-600"}>
                           {t(language, 'shelter.wood')}: {upgrade.cost.wood}
                         </div>}
                       {upgrade.cost.stone > 0 && <div className={resources.stone >= upgrade.cost.stone ? "text-green-600" : "text-red-600"}>
                           {t(language, 'shelter.stone')}: {upgrade.cost.stone}
                         </div>}
                       {upgrade.cost.iron > 0 && <div className={resources.iron >= upgrade.cost.iron ? "text-green-600" : "text-red-600"}>
                           {t(language, 'shelter.iron')}: {upgrade.cost.iron}
                         </div>}
                       {upgrade.cost.gold > 0 && <div className={resources.gold >= upgrade.cost.gold ? "text-green-600" : "text-red-600"}>
                           {t(language, 'shelter.gold')}: {upgrade.cost.gold}
                         </div>}
                     </div>
                  </div>
                  
                   <Button variant={upgrade.level >= upgrade.maxLevel ? "secondary" : "default"} size="sm" className="w-full" disabled={upgrade.level >= upgrade.maxLevel || resources.wood < upgrade.cost.wood || resources.stone < upgrade.cost.stone || resources.iron < upgrade.cost.iron || resources.gold < upgrade.cost.gold || !isBuildingActive(upgrade.id)} onClick={() => handleUpgrade(upgrade)}>
                     {upgrade.level >= upgrade.maxLevel ? t(language, 'shelter.maxLevel') : !isBuildingActive(upgrade.id) ? t(language, 'shelter.requiresWorkers') : t(language, 'shelter.upgrade')}
                  </Button>

                  {/* Статус рабочих для этого здания */}
                  <BuildingWorkerStatus buildingId={upgrade.id} activeWorkers={activeWorkers} />
                </CardContent>
              </Card>)}
          </div>}

        {/* Crafting Tab */}
        {activeTab === "crafting" && (isBuildingActive("workshop") ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {craftRecipes.map(recipe => <Card key={recipe.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      <Badge variant="outline">
                        {recipe.category === "weapon" && <Star className="w-3 h-3 mr-1" />}
                        {recipe.category === "armor" && <Package className="w-3 h-3 mr-1" />}
                        {recipe.category === "potion" && <Package className="w-3 h-3 mr-1" />}
                        {recipe.category}
                      </Badge>
                    </div>
                    <CardDescription>{recipe.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm">
                      <strong>Результат:</strong> {recipe.result}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Требования:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {recipe.requirements.wood && <div className={resources.wood >= recipe.requirements.wood ? "text-green-600" : "text-red-600"}>
                            Дерево: {recipe.requirements.wood}
                          </div>}
                        {recipe.requirements.stone && <div className={resources.stone >= recipe.requirements.stone ? "text-green-600" : "text-red-600"}>
                            Камень: {recipe.requirements.stone}
                          </div>}
                        {recipe.requirements.iron && <div className={resources.iron >= recipe.requirements.iron ? "text-green-600" : "text-red-600"}>
                            Железо: {recipe.requirements.iron}
                          </div>}
                        {recipe.requirements.gold && <div className={resources.gold >= recipe.requirements.gold ? "text-green-600" : "text-red-600"}>
                            Золото: {recipe.requirements.gold}
                          </div>}
                      </div>
                    </div>
                    
                    <Button className="w-full" disabled={!canAffordCraft(recipe)} onClick={() => handleCraft(recipe)}>
                      <Hammer className="w-4 h-4 mr-2" />
                      {t(language, 'shelter.create')}
                    </Button>
                  </CardContent>
                </Card>)}
            </div> : <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Hammer className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">{t(language, 'shelter.crafting')} {t(language, 'shelter.buildingInactive')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t(language, 'shelter.assignWorkers')} в {t(language, 'shelter.crafting')} во вкладке "{t(language, 'shelter.workers')}", чтобы активировать крафт
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("workers")}>
                    {t(language, 'shelter.assignWorkers')}
                  </Button>
                </div>
              </CardContent>
            </Card>)}

        {/* Barracks Tab */}
        {activeTab === "barracks" && (isBuildingActive("barracks") ? <Barracks barracksLevel={nestUpgrades.find(u => u.id === "barracks")?.level || 1} onUpgradeBuilding={() => {
        const barracks = nestUpgrades.find(u => u.id === "barracks");
        if (barracks) {
          handleUpgrade(barracks);
        }
      }} /> : <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">{t(language, 'shelter.barracks')} {t(language, 'shelter.buildingInactive')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t(language, 'shelter.assignWorkers')} в {t(language, 'shelter.barracks')} во вкладке "{t(language, 'shelter.workers')}", чтобы активировать их функции
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("workers")}>
                    {t(language, 'shelter.assignWorkers')}
                  </Button>
                </div>
              </CardContent>
            </Card>)}

        {/* Dragon Lair Tab */}
        {activeTab === "dragonlair" && (isBuildingActive("dragon_lair") ? <DragonLair lairLevel={nestUpgrades.find(u => u.id === "dragon_lair")?.level || 1} onUpgradeBuilding={() => {
        const dragonLair = nestUpgrades.find(u => u.id === "dragon_lair");
        if (dragonLair) {
          handleUpgrade(dragonLair);
        }
      }} /> : <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Flame className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">{t(language, 'shelter.dragonLair')} {t(language, 'shelter.buildingInactive')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t(language, 'shelter.assignWorkers')} в {t(language, 'shelter.dragonLair')} во вкладке "{t(language, 'shelter.workers')}", чтобы активировать его функции
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("workers")}>
                    {t(language, 'shelter.assignWorkers')}
                  </Button>
                </div>
              </CardContent>
            </Card>)}

        {/* Medical Tab */}
        {activeTab === "medical" && (isBuildingActive("medical") ? <MedicalBayComponent /> : <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">{t(language, 'shelter.medical')} {t(language, 'shelter.buildingInactive')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t(language, 'shelter.assignWorkers')} в {t(language, 'shelter.medical')} во вкладке "{t(language, 'shelter.workers')}", чтобы активировать его функции
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("workers")}>
                    {t(language, 'shelter.assignWorkers')}
                  </Button>
                </div>
              </CardContent>
            </Card>)}

        {/* Workers Tab */}
        {activeTab === "workers" && <WorkersManagement onSpeedBoostChange={setWorkersSpeedBoost} />}
      </div>
    </div>;
};