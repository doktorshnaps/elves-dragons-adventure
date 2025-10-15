import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Hammer, Shield, Flame, Heart, Users, Star } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { Barracks } from "@/components/game/shelter/Barracks";
import { DragonLair } from "@/components/game/shelter/DragonLair";
import { MedicalBayComponent } from "@/components/game/medical/MedicalBayComponent";
import { WorkersManagement } from "@/components/game/shelter/WorkersManagement";
import { useLanguage } from "@/hooks/useLanguage";

import { useInventoryDedupe } from "@/hooks/useInventoryDedupe";
import { t } from "@/utils/translations";
import { useShelterState } from "@/hooks/shelter/useShelterState";
import { ShelterUpgrades } from "@/components/game/shelter/ShelterUpgrades";
import { ShelterCrafting } from "@/components/game/shelter/ShelterCrafting";

export const Shelter = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  // Удаляем дубликаты из инвентаря
  useInventoryDedupe();
  
  const { accountLevel } = useGameStore();
  
  // Используем новый хук для управления состоянием
  const {
    activeTab,
    setActiveTab,
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
  } = useShelterState();

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url("/images/shelter-bg.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="container mx-auto p-2 sm:p-4 space-y-6 relative z-10">
        {/* Кнопка возврата и информация - адаптивный layout */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-start gap-2 mb-16 sm:mb-6 pt-2">
          {/* Кнопка возврата */}
          <div className="w-full sm:w-auto">
            <Button 
              variant="menu" 
              style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }} 
              onClick={() => navigate("/menu")}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад в меню
            </Button>
          </div>

          {/* Информация об аккаунте и ресурсы */}
          <div className="w-full sm:w-80">
            <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
              <CardContent className="p-2 sm:p-3">
                {/* Уровень аккаунта */}
                <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                  <Star className="h-4 w-4 text-white" />
                  <span className="text-xs sm:text-sm font-medium text-white">Уровень {accountLevel}</span>
                </div>
                
                {/* Ресурсы */}
                <div className="flex justify-between gap-1 sm:gap-2">
                  <div className="text-center flex-1">
                    <div className="text-base sm:text-lg">🪵</div>
                    <div className="text-[10px] sm:text-xs font-semibold text-white">{resources.wood}</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-base sm:text-lg">🪨</div>
                    <div className="text-[10px] sm:text-xs font-semibold text-white">{resources.stone}</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-base sm:text-lg">⛏️</div>
                    <div className="text-[10px] sm:text-xs font-semibold text-white">{resources.iron}</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-base sm:text-lg">💰</div>
                    <div className="text-[10px] sm:text-xs font-semibold text-white">{balance} ELL</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Заголовок */}
        <div className="flex items-center justify-center py-2 sm:py-4">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">{t(language, 'shelter.title')}</h1>
          </div>
        </div>

        {/* Вкладки управления */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 bg-black/50 border-2 border-white backdrop-blur-sm rounded-3xl p-1" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <TabsTrigger value="upgrades" className="flex items-center justify-center gap-1 sm:gap-2 text-white data-[state=active]:bg-white/20 rounded-2xl text-xs sm:text-sm px-1 sm:px-3">
              <Home className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t(language, 'shelter.upgrades')}</span>
            </TabsTrigger>
            <TabsTrigger value="crafting" className="flex items-center justify-center gap-1 sm:gap-2 text-white data-[state=active]:bg-white/20 rounded-2xl text-xs sm:text-sm px-1 sm:px-3">
              <Hammer className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t(language, 'shelter.crafting')}</span>
            </TabsTrigger>
            <TabsTrigger value="barracks" className="flex items-center justify-center gap-1 sm:gap-2 text-white data-[state=active]:bg-white/20 rounded-2xl text-xs sm:text-sm px-1 sm:px-3">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t(language, 'shelter.barracks')}</span>
            </TabsTrigger>
            <TabsTrigger value="dragonlair" className="flex items-center justify-center gap-1 sm:gap-2 text-white data-[state=active]:bg-white/20 rounded-2xl text-xs sm:text-sm px-1 sm:px-3">
              <Flame className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t(language, 'shelter.dragonLair')}</span>
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex items-center justify-center gap-1 sm:gap-2 text-white data-[state=active]:bg-white/20 rounded-2xl text-xs sm:text-sm px-1 sm:px-3">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t(language, 'shelter.medical')}</span>
            </TabsTrigger>
            <TabsTrigger value="workers" className="flex items-center justify-center gap-1 sm:gap-2 text-white data-[state=active]:bg-white/20 rounded-2xl text-xs sm:text-sm px-1 sm:px-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t(language, 'shelter.workers')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Содержимое вкладок */}
          <TabsContent value="upgrades" className="mt-6">
            <ShelterUpgrades
              upgrades={nestUpgrades}
              canAffordUpgrade={canAffordUpgrade}
              handleUpgrade={handleUpgrade}
              isUpgrading={isUpgrading}
              getUpgradeProgress={getUpgradeProgress}
              formatRemainingTime={formatRemainingTime}
              hasWorkersInBuilding={hasWorkersInBuilding}
              getActiveWorkersInBuilding={getActiveWorkersInBuilding}
              buildingLevels={buildingLevels}
              getUpgradeTime={getUpgradeTime}
              isUpgradeReady={isUpgradeReady}
            />
          </TabsContent>

          <TabsContent value="crafting" className="mt-6">
            <ShelterCrafting
              recipes={craftRecipes}
              canAffordCraft={canAffordCraft}
              handleCraft={handleCraft}
              workshopLevel={buildingLevels.workshop}
            />
          </TabsContent>

          <TabsContent value="barracks" className="mt-6">
            {buildingLevels.barracks > 0 ? (
              <Barracks 
                barracksLevel={buildingLevels.barracks}
                onUpgradeBuilding={() => {
                  const barracksUpgrade = nestUpgrades.find(u => u.id === 'barracks');
                  if (barracksUpgrade) handleUpgrade(barracksUpgrade);
                }}
              />
            ) : (
              <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                <CardContent className="p-8 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-white/50" />
                  <h3 className="text-xl font-semibold mb-2 text-white">{t(language, 'shelter.barracksRequired')}</h3>
                  <p className="text-white/70">{t(language, 'shelter.barracksRequiredDesc')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dragonlair" className="mt-6">
            {buildingLevels.dragon_lair > 0 ? (
              <DragonLair 
                lairLevel={buildingLevels.dragon_lair}
                onUpgradeBuilding={() => {
                  const lairUpgrade = nestUpgrades.find(u => u.id === 'dragon_lair');
                  if (lairUpgrade) handleUpgrade(lairUpgrade);
                }}
              />
            ) : (
              <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                <CardContent className="p-8 text-center">
                  <Flame className="w-16 h-16 mx-auto mb-4 text-white/50" />
                  <h3 className="text-xl font-semibold mb-2 text-white">{t(language, 'shelter.dragonLairRequired')}</h3>
                  <p className="text-white/70">{t(language, 'shelter.dragonLairRequiredDesc')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="medical" className="mt-6">
            {buildingLevels.medical > 0 ? (
              <MedicalBayComponent />
            ) : (
              <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                <CardContent className="p-8 text-center">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-white/50" />
                  <h3 className="text-xl font-semibold mb-2 text-white">{t(language, 'shelter.medicalRequired')}</h3>
                  <p className="text-white/70">{t(language, 'shelter.medicalRequiredDesc')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="workers" className="mt-6">
            <WorkersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
