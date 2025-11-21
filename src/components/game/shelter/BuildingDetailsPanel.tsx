import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NestUpgrade } from "@/hooks/shelter/useShelterState";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useItemTemplates } from "@/hooks/useItemTemplates";
import { useMemo } from "react";
interface BuildingDetailsPanelProps {
  selectedBuilding: NestUpgrade | null;
  canAfford: boolean;
  isUpgrading: boolean;
  onUpgrade: () => void;
  isUpgradeReady: boolean;
  insideDialog?: boolean;
  resources?: {
    wood: number;
    stone: number;
  };
  inventoryCounts?: Record<string, number>;
  buildingLevels?: Record<string, number>;
}
export const BuildingDetailsPanel = ({
  selectedBuilding,
  canAfford,
  isUpgrading,
  onUpgrade,
  isUpgradeReady,
  insideDialog = false,
  resources,
  inventoryCounts = {},
  buildingLevels = {}
}: BuildingDetailsPanelProps) => {
  const { language } = useLanguage();
  const { getItemName, getTemplate } = useItemTemplates();
  
  // Маппинг ID зданий на их названия
  const buildingNames: Record<string, string> = {
    'main_hall': t(language, 'shelter.mainHall') || 'Главный зал',
    'workshop': t(language, 'shelter.workshop') || 'Мастерская',
    'storage': t(language, 'shelter.storage') || 'Склад',
    'sawmill': t(language, 'shelter.sawmill') || 'Лесопилка',
    'quarry': t(language, 'shelter.quarry') || 'Каменоломня',
    'barracks': t(language, 'shelter.barracksBuilding') || 'Казармы',
    'dragon_lair': t(language, 'shelter.dragonLairBuilding') || 'Драконье логово',
    'medical': t(language, 'shelter.medicalBuilding') || 'Медицинский блок',
    'forge': 'Кузница'
  };

  // Debug: compute disabled state for Upgrade button
  const computedDisabled = !isUpgradeReady && (isUpgrading || !canAfford);
  if (selectedBuilding) {
    try {
      console.log('🧪 [BuildingDetailsPanel] state', {
        buildingId: selectedBuilding.id,
        canAfford,
        isUpgrading,
        isUpgradeReady,
        computedDisabled,
        reason: !canAfford ? 'cannot afford' : isUpgrading ? 'upgrading' : 'ready'
      });
    } catch {}
  }

  // Нормализуем требуемые предметы (поддержка массива и объектной формы из БД)
  const normalizedRequiredItems = useMemo(() => {
    const raw = selectedBuilding?.requiredItems as any;
    if (!raw) return [] as any[];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') {
      return Object.entries(raw).map(([key, qty]) => ({ item_id: key, quantity: Number(qty) }));
    }
    return [] as any[];
  }, [selectedBuilding]);

  if (!selectedBuilding) {
    const emptyContent = (
      <div className="p-8 text-center space-y-4 opacity-40">
        <div className="text-4xl">🏗️</div>
        <p className="text-sm text-muted-foreground">
          {t(language, 'shelter.selectBuilding') || 'Выберите здание'}
        </p>
      </div>
    );
    
    if (insideDialog) {
      return emptyContent;
    }
    return <Card variant="glassmorphic" className="sticky top-6 h-fit opacity-50 bg-card/40">
        {emptyContent}
      </Card>;
  }
  const detailsContent = <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-primary mb-2">
          {selectedBuilding.name}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {selectedBuilding.description}
        </p>
        <Badge variant="default" className="mt-3 text-sm font-bold bg-primary text-primary-foreground px-3 py-1">
          {t(language, 'shelter.level')} {selectedBuilding.level}/{selectedBuilding.maxLevel}
        </Badge>
      </div>

      {selectedBuilding.level < selectedBuilding.maxLevel && <>
          {/* Cost Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">💰</span>
              {t(language, 'shelter.upgradeCost')}
            </h3>
            
            <div className="space-y-2">
              {selectedBuilding.cost.wood > 0 && <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪵</span>
                    <span className="text-sm">{t(language, 'resources.wood') || 'Дерево'}</span>
                  </div>
                  <span className="font-bold">
                    {selectedBuilding.cost.wood}
                    {resources && <span className="text-xs ml-1 opacity-70">({resources.wood})</span>}
                  </span>
                </div>}
              {selectedBuilding.cost.stone > 0 && <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪨</span>
                    <span className="text-sm">{t(language, 'resources.stone') || 'Камень'}</span>
                  </div>
                  <span className="font-bold">
                    {selectedBuilding.cost.stone}
                    {resources && <span className="text-xs ml-1 opacity-70">({resources.stone})</span>}
                  </span>
                </div>}
              {selectedBuilding.cost.balance > 0 && <div className="flex items-center justify-between px-3 py-2 bg-primary/15 rounded-lg border-2 border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span className="text-sm">ELL</span>
                  </div>
                  <span className="font-bold text-primary">{selectedBuilding.cost.balance}</span>
                </div>}
              {selectedBuilding.cost.gt > 0 && <div className="flex items-center justify-between px-3 py-2 bg-primary/15 rounded-lg border-2 border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    <span className="text-sm">GT</span>
                  </div>
                  <span className="font-bold text-primary">{selectedBuilding.cost.gt}</span>
                </div>}
            </div>
          </div>

          {/* Required Buildings */}
          {selectedBuilding.requiredBuildings && selectedBuilding.requiredBuildings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                {t(language, 'shelter.requiredBuildings') || 'Требуемые здания'}
              </h3>
              <div className="space-y-1">
                {selectedBuilding.requiredBuildings.map((req, idx) => {
                  const buildingName = buildingNames[req.building_id] || req.building_id;
                  const currentLevel = buildingLevels[req.building_id] || 0;
                  const isSatisfied = currentLevel >= req.level;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                        isSatisfied 
                          ? 'border-green-500/50 bg-green-500/10' 
                          : 'border-red-500/50 bg-red-500/10'
                      }`}
                    >
                      <span className="text-sm font-medium">{buildingName}</span>
                      <span className={`text-sm font-bold ${isSatisfied ? 'text-green-500' : 'text-red-500'}`}>
                        {t(language, 'shelter.level')} {req.level} ({currentLevel})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Required Items */}
          {normalizedRequiredItems && normalizedRequiredItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{t(language, 'shelter.requiredItems')}</h3>
              <div className="space-y-1">
                {normalizedRequiredItems.map((rawItem: any, idx: number) => {
                  let itemId = '';
                  let reqQty = 1;

                  if (typeof rawItem === 'string' || typeof rawItem === 'number') {
                    itemId = String(rawItem);
                  } else if (typeof rawItem === 'object' && rawItem !== null) {
                    itemId = String(rawItem.item_id ?? rawItem.itemId ?? rawItem.id ?? rawItem.type ?? '');
                    reqQty = Number(rawItem.quantity ?? rawItem.qty ?? rawItem.count ?? rawItem.amount ?? 1);
                  }

                  const template = getTemplate(itemId);
                  const displayName = template?.name || getItemName(itemId);
                  const templateItemId = template?.item_id || itemId;

                  // Используем item_id из шаблона для поиска в item_instances
                  const playerHas = inventoryCounts[templateItemId] || 0;
                  return (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/20">
                      <span className="text-sm font-medium">{displayName}</span>
                      <span className="text-sm">×{reqQty} ({playerHas})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">✨</span>
              {t(language, 'shelter.benefit')}
            </h3>
            <div className="p-3 bg-accent/10 rounded-lg border-2 border-accent/30">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedBuilding.benefit}
              </p>
            </div>
          </div>

          {/* Upgrade Button */}
          <Button className="w-full font-bold text-base py-6 transition-all duration-300 hover:-translate-y-0.5" onClick={onUpgrade} disabled={computedDisabled} variant={isUpgradeReady ? "default" : undefined}>
            {isUpgradeReady ? `✨ ${t(language, 'shelter.install')}` : isUpgrading ? `⏳ ${t(language, 'shelter.upgrading')}` : selectedBuilding.level === 0 ? `🏗️ ${t(language, 'shelter.build')}` : `⬆️ ${t(language, 'shelter.upgrade')}`}
          </Button>
        </>}

      {selectedBuilding.level >= selectedBuilding.maxLevel && <Badge variant="default" className="w-full justify-center py-3 text-sm font-bold bg-gradient-to-r from-primary via-yellow-400 to-primary">
          ⭐ {t(language, 'shelter.maxLevel')} ⭐
        </Badge>}
    </div>;
  if (insideDialog) {
    return detailsContent;
  }
  return <Card variant="glassmorphic" className="sticky top-6 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
      {detailsContent}
    </Card>;
};