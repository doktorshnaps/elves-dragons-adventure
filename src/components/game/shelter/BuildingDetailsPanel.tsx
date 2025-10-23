import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NestUpgrade } from "@/hooks/shelter/useShelterState";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useInventoryState } from "@/hooks/useInventoryState";
import { getItemName, resolveItemKey } from "@/utils/itemNames";
import { useMemo } from "react";

interface BuildingDetailsPanelProps {
  selectedBuilding: NestUpgrade | null;
  canAfford: boolean;
  isUpgrading: boolean;
  onUpgrade: () => void;
  isUpgradeReady: boolean;
  insideDialog?: boolean;
}

export const BuildingDetailsPanel = ({
  selectedBuilding,
  canAfford,
  isUpgrading,
  onUpgrade,
  isUpgradeReady,
  insideDialog = false
}: BuildingDetailsPanelProps) => {
  const { language } = useLanguage();
  const { inventory } = useInventoryState();

  // Подсчитываем количество каждого предмета в инвентаре
  const inventoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(item => {
      const key = resolveItemKey(item.type);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [inventory]);

  if (!selectedBuilding) {
    const emptyContent = (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">🏗️</div>
        <h2 className="text-2xl font-bold text-primary mb-3">
          {t(language, 'shelter.selectBuilding') || 'Выберите здание'}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t(language, 'shelter.selectBuildingDesc') || 
            'Нажмите на здание, чтобы увидеть подробную информацию и возможности улучшения.'}
        </p>
      </div>
    );

    if (insideDialog) {
      return emptyContent;
    }
    
    return (
      <Card variant="glassmorphic" className="sticky top-6 h-fit">
        {emptyContent}
      </Card>
    );
  }

  const detailsContent = (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-primary mb-2">
          {selectedBuilding.name}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {selectedBuilding.description}
        </p>
        <Badge 
          variant="default" 
          className="mt-3 text-sm font-bold bg-primary text-primary-foreground px-3 py-1"
        >
          {t(language, 'shelter.level')} {selectedBuilding.level}/{selectedBuilding.maxLevel}
        </Badge>
      </div>

      {selectedBuilding.level < selectedBuilding.maxLevel && (
        <>
          {/* Cost Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">💰</span>
              {t(language, 'shelter.upgradeCost')}
            </h3>
            
            <div className="space-y-2">
              {selectedBuilding.cost.wood > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪵</span>
                    <span className="text-sm">{t(language, 'resources.wood') || 'Дерево'}</span>
                  </div>
                  <span className="font-bold">{selectedBuilding.cost.wood}</span>
                </div>
              )}
              {selectedBuilding.cost.stone > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪨</span>
                    <span className="text-sm">{t(language, 'resources.stone') || 'Камень'}</span>
                  </div>
                  <span className="font-bold">{selectedBuilding.cost.stone}</span>
                </div>
              )}
              {selectedBuilding.cost.iron > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⛏️</span>
                    <span className="text-sm">{t(language, 'resources.iron') || 'Железо'}</span>
                  </div>
                  <span className="font-bold">{selectedBuilding.cost.iron}</span>
                </div>
              )}
              {selectedBuilding.cost.gold > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪙</span>
                    <span className="text-sm">{t(language, 'resources.gold') || 'Золото'}</span>
                  </div>
                  <span className="font-bold">{selectedBuilding.cost.gold}</span>
                </div>
              )}
              {selectedBuilding.cost.balance > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-primary/15 rounded-lg border-2 border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span className="text-sm">ELL</span>
                  </div>
                  <span className="font-bold text-primary">{selectedBuilding.cost.balance}</span>
                </div>
              )}
              {selectedBuilding.cost.gt > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-primary/15 rounded-lg border-2 border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    <span className="text-sm">GT</span>
                  </div>
                  <span className="font-bold text-primary">{selectedBuilding.cost.gt}</span>
                </div>
              )}
            </div>
          </div>

          {/* Required Items */}
          {selectedBuilding.requiredItems && selectedBuilding.requiredItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-xl">🎒</span>
                {t(language, 'shelter.requiredItems')}
              </h3>
              
              <div className="space-y-2">
                {selectedBuilding.requiredItems.map((rawItem: any, idx: number) => {
                  let itemKey = '';
                  let reqQty = 1;
                  let rawName: string | undefined;
                  
                  if (typeof rawItem === 'string' || typeof rawItem === 'number') {
                    itemKey = resolveItemKey(String(rawItem));
                  } else if (typeof rawItem === 'object' && rawItem !== null) {
                    rawName = rawItem.name ?? rawItem.item_name ?? rawItem.title ?? rawItem.display_name;
                    const rawId = rawItem.item_id ?? rawItem.itemId ?? rawItem.id ?? rawItem.type ?? rawName ?? '';
                    itemKey = resolveItemKey(String(rawId));
                    reqQty = Number(rawItem.quantity ?? rawItem.qty ?? rawItem.count ?? rawItem.amount ?? 1);
                  }
                  
                  const fallbackName = getItemName(itemKey, language);
                  const displayName = (rawName && typeof rawName === 'string') ? rawName : fallbackName;
                  
                  let playerHas = inventoryCounts[itemKey] || 0;
                  if (!playerHas && rawName) {
                    const lower = rawName.toLowerCase();
                    playerHas = inventory.filter(i => (i.name || '').toLowerCase() === lower).length || playerHas;
                  }
                  
                  const hasEnough = playerHas >= reqQty;
                  
                  return (
                    <div
                      key={idx}
                      className={`
                        flex items-center justify-between px-3 py-2 rounded-lg border-2
                        ${hasEnough 
                          ? 'bg-success/15 border-success/40' 
                          : 'bg-destructive/15 border-destructive/40'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className={hasEnough ? 'text-success' : 'text-destructive'}>
                          {hasEnough ? '✓' : '✗'}
                        </span>
                        <span className="text-sm font-medium">{displayName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">×{reqQty}</span>
                        <Badge 
                          variant="outline"
                          className={`text-xs ${hasEnough ? 'border-success text-success' : 'border-destructive text-destructive'}`}
                        >
                          {playerHas}
                        </Badge>
                      </div>
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
          <Button
            className="w-full font-bold text-base py-6 transition-all duration-300 hover:-translate-y-0.5"
            onClick={onUpgrade}
            disabled={(!canAfford && !isUpgradeReady) || (isUpgrading && !isUpgradeReady)}
            variant={isUpgradeReady ? "default" : undefined}
          >
            {isUpgradeReady 
              ? `✨ ${t(language, 'shelter.install')}` 
              : isUpgrading 
                ? `⏳ ${t(language, 'shelter.upgrading')}` 
                : selectedBuilding.level === 0 
                  ? `🏗️ ${t(language, 'shelter.build')}`
                  : `⬆️ ${t(language, 'shelter.upgrade')}`
            }
          </Button>
        </>
      )}

      {selectedBuilding.level >= selectedBuilding.maxLevel && (
        <Badge variant="default" className="w-full justify-center py-3 text-sm font-bold bg-gradient-to-r from-primary via-yellow-400 to-primary">
          ⭐ {t(language, 'shelter.maxLevel')} ⭐
        </Badge>
      )}
    </div>
  );

  if (insideDialog) {
    return detailsContent;
  }

  return (
    <Card 
      variant="glassmorphic"
      className="sticky top-6 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto"
    >
      {detailsContent}
    </Card>
  );
};
