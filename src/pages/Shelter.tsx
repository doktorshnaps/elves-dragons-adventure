import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Hammer, Wrench, Package, Star, Shield, Flame, Heart, Users } from "lucide-react";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
import { useGameStore } from "@/stores/gameStore";
import { AccountLevelDisplay } from "@/components/game/account/AccountLevelDisplay";
import { Barracks } from "@/components/game/shelter/Barracks";
import { DragonLair } from "@/components/game/shelter/DragonLair";
import { MedicalBayComponent } from "@/components/game/medical/MedicalBayComponent";
import { WorkersManagement } from "@/components/game/shelter/WorkersManagement";
import { BuildingWorkerStatus } from "@/components/game/shelter/BuildingWorkerStatus";
import { useState } from "react";

interface NestUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: { wood: number; stone: number; iron: number; gold: number };
  benefit: string;
}

interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  requirements: { wood?: number; stone?: number; iron?: number; gold?: number };
  result: string;
  category: "weapon" | "armor" | "potion" | "misc";
}

export const Shelter = () => {
  const navigate = useNavigate();
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();
  const { accountLevel, accountExperience } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<"upgrades" | "crafting" | "barracks" | "dragonlair" | "medical" | "workers">("upgrades");
  const [workersSpeedBoost, setWorkersSpeedBoost] = useState(0);

  // Получаем активных рабочих из gameData
  const activeWorkers = gameData.activeWorkers || [];

  // Временные данные ресурсов (в будущем будут из gameData)
  const [resources, setResources] = useState({
    wood: 150,
    stone: 80,
    iron: 45,
    gold: gameData.balance || 0
  });

  const nestUpgrades: NestUpgrade[] = [
    {
      id: "main_hall",
      name: "Главный зал",
      description: "Увеличивает общую вместимость лагеря",
      level: 1,
      maxLevel: 10,
      cost: { wood: 50, stone: 30, iron: 0, gold: 100 },
      benefit: "+20 слотов инвентаря"
    },
    {
      id: "workshop",
      name: "Мастерская",
      description: "Позволяет создавать более качественные предметы",
      level: 0,
      maxLevel: 5,
      cost: { wood: 80, stone: 40, iron: 20, gold: 200 },
      benefit: "Разблокирует редкие рецепты"
    },
    {
      id: "storage",
      name: "Склад",
      description: "Увеличивает лимит хранения ресурсов",
      level: 2,
      maxLevel: 8,
      cost: { wood: 60, stone: 60, iron: 10, gold: 150 },
      benefit: "+100 к лимиту ресурсов"
    },
    {
      id: "sawmill",
      name: "Лесопилка",
      description: "Производит дерево для строительства",
      level: 0,
      maxLevel: 8,
      cost: { wood: 40, stone: 20, iron: 5, gold: 80 },
      benefit: "+10 дерева в час"
    },
    {
      id: "quarry",
      name: "Каменоломня",
      description: "Добывает камень для укреплений",
      level: 0,
      maxLevel: 8,
      cost: { wood: 30, stone: 50, iron: 10, gold: 120 },
      benefit: "+8 камня в час"
    },
    {
      id: "dragon_lair",
      name: "Драконье Логово",
      description: "Таинственное место силы драконов",
      level: 1,
      maxLevel: 8,
      cost: { wood: 100, stone: 80, iron: 30, gold: 500 },
      benefit: "+50% к опыту в бою"
    },
    {
      id: "barracks",
      name: "Казарма",
      description: "Улучшение и тренировка героев",
      level: 1,
      maxLevel: 8,
      cost: { wood: 120, stone: 60, iron: 40, gold: 300 },
      benefit: "Позволяет улучшать героев"
    },
    {
      id: "medical_post",
      name: "Медпункт",
      description: "Лечит раненых и восстанавливает здоровье",
      level: 0,
      maxLevel: 8,
      cost: { wood: 25, stone: 15, iron: 5, gold: 60 },
      benefit: "Автовосстановление ХП"
    }
  ];

  const craftRecipes: CraftRecipe[] = [
  ];

  const canAffordUpgrade = (upgrade: NestUpgrade) => {
    return (
      resources.wood >= upgrade.cost.wood &&
      resources.stone >= upgrade.cost.stone &&
      resources.iron >= upgrade.cost.iron &&
      resources.gold >= upgrade.cost.gold &&
      upgrade.level < upgrade.maxLevel
    );
  };

  const canAffordCraft = (recipe: CraftRecipe) => {
    return (
      (!recipe.requirements.wood || resources.wood >= recipe.requirements.wood) &&
      (!recipe.requirements.stone || resources.stone >= recipe.requirements.stone) &&
      (!recipe.requirements.iron || resources.iron >= recipe.requirements.iron) &&
      (!recipe.requirements.gold || resources.gold >= recipe.requirements.gold)
    );
  };

  const handleUpgrade = (upgrade: NestUpgrade) => {
    if (!canAffordUpgrade(upgrade)) {
      toast({
        title: "Недостаточно ресурсов",
        description: "У вас не хватает ресурсов для этого улучшения",
        variant: "destructive"
      });
      return;
    }

    setResources(prev => ({
      ...prev,
      wood: prev.wood - upgrade.cost.wood,
      stone: prev.stone - upgrade.cost.stone,
      iron: prev.iron - upgrade.cost.iron,
      gold: prev.gold - upgrade.cost.gold
    }));

    toast({
      title: "Улучшение завершено!",
      description: `${upgrade.name} улучшен до уровня ${upgrade.level + 1}`
    });
  };

  const handleCraft = (recipe: CraftRecipe) => {
    if (!canAffordCraft(recipe)) {
      toast({
        title: "Недостаточно ресурсов",
        description: "У вас не хватает ресурсов для создания этого предмета",
        variant: "destructive"
      });
      return;
    }

    setResources(prev => ({
      ...prev,
      wood: prev.wood - (recipe.requirements.wood || 0),
      stone: prev.stone - (recipe.requirements.stone || 0),
      iron: prev.iron - (recipe.requirements.iron || 0),
      gold: prev.gold - (recipe.requirements.gold || 0)
    }));

    toast({
      title: "Предмет создан!",
      description: `Вы создали: ${recipe.name}`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/menu')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Лагерь</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Account Level Display */}
          <AccountLevelDisplay 
            experience={accountExperience} 
            level={accountLevel}
          />
          
          {/* Resources Display */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ресурсы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-600 rounded" />
                  <span>Дерево: {resources.wood}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-500 rounded" />
                  <span>Камень: {resources.stone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-600 rounded" />
                  <span>Железо: {resources.iron}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full" />
                  <span>Золото: {resources.gold}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={activeTab === "upgrades" ? "default" : "outline"}
            onClick={() => setActiveTab("upgrades")}
            className="flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Улучшения гнезда
          </Button>
          <Button 
            variant={activeTab === "crafting" ? "default" : "outline"}
            onClick={() => setActiveTab("crafting")}
            className="flex items-center gap-2"
          >
            <Hammer className="w-4 h-4" />
            Крафт предметов
          </Button>
          <Button 
            variant={activeTab === "barracks" ? "default" : "outline"}
            onClick={() => setActiveTab("barracks")}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Казарма
          </Button>
          <Button 
            variant={activeTab === "dragonlair" ? "default" : "outline"}
            onClick={() => setActiveTab("dragonlair")}
            className="flex items-center gap-2"
          >
            <Flame className="w-4 h-4" />
            Драконье Логово
          </Button>
          <Button 
            variant={activeTab === "medical" ? "default" : "outline"}
            onClick={() => setActiveTab("medical")}
            className="flex items-center gap-2"
          >
            <Heart className="w-4 h-4" />
            Медпункт
          </Button>
          <Button 
            variant={activeTab === "workers" ? "default" : "outline"}
            onClick={() => setActiveTab("workers")}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Рабочие
          </Button>
        </div>

        {/* Upgrades Tab */}
        {activeTab === "upgrades" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nestUpgrades.map((upgrade) => (
              <Card key={upgrade.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{upgrade.name}</CardTitle>
                    <Badge variant="secondary">
                      Ур. {upgrade.level}/{upgrade.maxLevel}
                    </Badge>
                  </div>
                  <CardDescription>{upgrade.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={(upgrade.level / upgrade.maxLevel) * 100} />
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Эффект:</strong> {upgrade.benefit}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Стоимость улучшения:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {upgrade.cost.wood > 0 && (
                        <div className={resources.wood >= upgrade.cost.wood ? "text-green-600" : "text-red-600"}>
                          Дерево: {upgrade.cost.wood}
                        </div>
                      )}
                      {upgrade.cost.stone > 0 && (
                        <div className={resources.stone >= upgrade.cost.stone ? "text-green-600" : "text-red-600"}>
                          Камень: {upgrade.cost.stone}
                        </div>
                      )}
                      {upgrade.cost.iron > 0 && (
                        <div className={resources.iron >= upgrade.cost.iron ? "text-green-600" : "text-red-600"}>
                          Железо: {upgrade.cost.iron}
                        </div>
                      )}
                      {upgrade.cost.gold > 0 && (
                        <div className={resources.gold >= upgrade.cost.gold ? "text-green-600" : "text-red-600"}>
                          Золото: {upgrade.cost.gold}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={!canAffordUpgrade(upgrade)}
                    onClick={() => handleUpgrade(upgrade)}
                  >
                    {upgrade.level >= upgrade.maxLevel ? "Максимальный уровень" : "Улучшить"}
                  </Button>

                  {/* Статус рабочих для этого здания */}
                  <BuildingWorkerStatus 
                    buildingId={upgrade.id}
                    activeWorkers={activeWorkers}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Crafting Tab */}
        {activeTab === "crafting" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {craftRecipes.map((recipe) => (
              <Card key={recipe.id} className="relative">
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
                      {recipe.requirements.wood && (
                        <div className={resources.wood >= recipe.requirements.wood ? "text-green-600" : "text-red-600"}>
                          Дерево: {recipe.requirements.wood}
                        </div>
                      )}
                      {recipe.requirements.stone && (
                        <div className={resources.stone >= recipe.requirements.stone ? "text-green-600" : "text-red-600"}>
                          Камень: {recipe.requirements.stone}
                        </div>
                      )}
                      {recipe.requirements.iron && (
                        <div className={resources.iron >= recipe.requirements.iron ? "text-green-600" : "text-red-600"}>
                          Железо: {recipe.requirements.iron}
                        </div>
                      )}
                      {recipe.requirements.gold && (
                        <div className={resources.gold >= recipe.requirements.gold ? "text-green-600" : "text-red-600"}>
                          Золото: {recipe.requirements.gold}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={!canAffordCraft(recipe)}
                    onClick={() => handleCraft(recipe)}
                  >
                    <Hammer className="w-4 h-4 mr-2" />
                    Создать
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Barracks Tab */}
        {activeTab === "barracks" && (
          <Barracks 
            barracksLevel={nestUpgrades.find(u => u.id === "barracks")?.level || 1}
            onUpgradeBuilding={() => {
              const barracks = nestUpgrades.find(u => u.id === "barracks");
              if (barracks) {
                handleUpgrade(barracks);
              }
            }}
          />
        )}

        {/* Dragon Lair Tab */}
        {activeTab === "dragonlair" && (
          <DragonLair 
            lairLevel={nestUpgrades.find(u => u.id === "dragon_lair")?.level || 1}
            onUpgradeBuilding={() => {
              const dragonLair = nestUpgrades.find(u => u.id === "dragon_lair");
              if (dragonLair) {
                handleUpgrade(dragonLair);
              }
            }}
          />
        )}

        {/* Medical Bay Tab */}
        {activeTab === "medical" && (
          <MedicalBayComponent />
        )}

        {activeTab === "workers" && (
          <WorkersManagement onSpeedBoostChange={setWorkersSpeedBoost} />
        )}
      </div>
    </div>
  );
};