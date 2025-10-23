import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Users } from "lucide-react";
import { NestUpgrade } from "@/hooks/shelter/useShelterState";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useInventoryState } from "@/hooks/useInventoryState";
import { getItemName, resolveItemKey } from "@/utils/itemNames";
import { useMemo } from "react";

interface BuildingCardProps {
  upgrade: NestUpgrade;
  canAfford: boolean;
  isUpgrading: boolean;
  upgradeProgress: { progress: number; remainingTime: number } | null;
  hasWorkers: boolean;
  activeWorkersCount: number;
  onUpgrade: () => void;
  formatRemainingTime: (ms: number) => string;
  children?: React.ReactNode;
  isUpgradeReady: boolean;
}

export const BuildingCard = ({
  upgrade,
  canAfford,
  isUpgrading,
  upgradeProgress,
  hasWorkers,
  activeWorkersCount,
  onUpgrade,
  formatRemainingTime,
  children,
  isUpgradeReady
}: BuildingCardProps) => {
  const { language } = useLanguage();
  const { inventory } = useInventoryState();
  const requiresWorkers = upgrade.id !== 'main_hall' && upgrade.id !== 'storage';

  // Подсчитываем количество каждого предмета в инвентаре
  const inventoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(item => {
      const key = resolveItemKey(item.type);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [inventory]);

  return (
    <Card 
      variant="glassmorphic" 
      className={`group relative overflow-hidden min-h-[200px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(251,191,36,0.2)] hover:-translate-y-1 ${isUpgrading ? 'animate-pulse-slow' : ''}`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {upgrade.name}
          </CardTitle>
          <Badge 
            variant="default" 
            className="text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded-full"
          >
            {t(language, 'shelter.level')} {upgrade.level}/{upgrade.maxLevel}
          </Badge>
        </div>
        
        {/* Level Progress Bar */}
        {upgrade.level > 0 && upgrade.level < upgrade.maxLevel && (
          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-primary to-yellow-400 transition-all duration-500 relative overflow-hidden"
              style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        )}
        
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {upgrade.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Прогресс апгрейда с анимацией */}
        {isUpgrading && upgradeProgress && (
          <div className="space-y-2 p-3 rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-sm relative overflow-hidden">
            {/* Animated production indicator */}
            <div className="absolute top-2 right-2 px-2 py-1 bg-success text-white text-[10px] font-bold rounded-full animate-pulse-slow">
              {t(language, 'shelter.producing')}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Clock className="w-4 h-4 text-primary animate-pulse" />
                {t(language, 'shelter.upgrading')}
              </span>
              <span className="font-bold text-primary">
                {formatRemainingTime(upgradeProgress.remainingTime)}
              </span>
            </div>
            
            {/* Progress bar with shimmer effect */}
            <div className="relative w-full h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-success via-primary to-success transition-all duration-300 relative"
                style={{ width: `${upgradeProgress.progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        )}

        {/* Статус рабочих с улучшенным дизайном */}
        {requiresWorkers && (
          <div className={`flex items-center gap-2 text-sm p-2.5 rounded-lg border ${
            hasWorkers 
              ? 'bg-success/10 text-success border-success/30' 
              : 'bg-warning/10 text-warning border-warning/30'
          }`}>
            <Users className="w-4 h-4 flex-shrink-0" />
            {hasWorkers ? (
              <span className="font-medium">{t(language, 'shelter.workersActive')}: <strong>{activeWorkersCount}</strong></span>
            ) : (
              <span className="font-medium">{t(language, 'shelter.needWorkers')}</span>
            )}
          </div>
        )}

        {/* Дополнительная информация о здании */}
        {children}

        {/* Стоимость апгрейда */}
        {upgrade.level < upgrade.maxLevel && (
          <div className="space-y-3">
            <div className="text-sm font-medium">{t(language, 'shelter.upgradeCost')}:</div>
            
            {/* Требования по уровню главного зала */}
            {upgrade.requiredMainHallLevel > 0 && (
              <div className="p-3 bg-warning/15 border-2 border-warning/30 rounded-lg text-sm flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <span className="font-semibold text-warning">
                  {t(language, 'shelter.requiresMainHall')}: <strong className="text-base">{upgrade.requiredMainHallLevel}</strong>
                </span>
              </div>
            )}

            {/* Требуемые предметы с улучшенным дизайном */}
            {upgrade.requiredItems && upgrade.requiredItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-primary flex items-center gap-2">
                  <span className="text-lg">🎒</span>
                  {t(language, 'shelter.requiredItems')}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {upgrade.requiredItems.map((rawItem: any, idx) => {
                    console.log('🔍 Building upgrade required item:', rawItem);
                    
                    let itemKey = '';
                    let reqQty = 1;
                    let rawName: string | undefined;
                    
                    // Проверяем разные возможные структуры данных
                    if (typeof rawItem === 'string' || typeof rawItem === 'number') {
                      // Если это строка/число, возможно это ID
                      itemKey = resolveItemKey(String(rawItem));
                    } else if (typeof rawItem === 'object' && rawItem !== null) {
                      // Объект - ищем ID и имя в разных полях
                      rawName = rawItem.name ?? rawItem.item_name ?? rawItem.title ?? rawItem.display_name;
                      const rawId = rawItem.item_id ?? rawItem.itemId ?? rawItem.id ?? rawItem.type ?? rawName ?? '';
                      itemKey = resolveItemKey(String(rawId));
                      reqQty = Number(rawItem.quantity ?? rawItem.qty ?? rawItem.count ?? rawItem.amount ?? 1);
                    } else {
                      // Неизвестный формат
                      console.warn('Unknown required item format:', rawItem);
                      itemKey = String(rawItem);
                    }
                    
                    const fallbackName = getItemName(itemKey, language);
                    const displayName = (rawName && typeof rawName === 'string') ? rawName : fallbackName;
                    
                    // Подсчёт количества у игрока с несколькими стратегиями сопоставления
                    let playerHas = inventoryCounts[itemKey] || 0;
                    if (!playerHas && rawName) {
                      // Попытка сопоставить по локализованному имени
                      const lower = rawName.toLowerCase();
                      playerHas = inventory.filter(i => (i.name || '').toLowerCase() === lower).length || playerHas;
                    }
                    
                    const hasEnough = playerHas >= reqQty;
                    
                    console.log('🔍 Resolved:', { rawItem, itemKey, displayName, reqQty, playerHas });
                    
                    return (
                      <div 
                        key={idx}
                        className={`
                          px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all
                          ${hasEnough 
                            ? 'bg-success/15 border-success/40 text-success shadow-sm' 
                            : 'bg-destructive/15 border-destructive/40 text-destructive shadow-sm'
                          }
                        `}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{hasEnough ? '✓' : '✗'}</span>
                          <span className="font-bold">{displayName}</span>
                          <span className="opacity-75">×{reqQty}</span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded ${hasEnough ? 'bg-success/20' : 'bg-destructive/20'}`}>
                            {playerHas}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ресурсы с улучшенным дизайном */}
            <div className="grid grid-cols-2 gap-3">
              {upgrade.cost.wood > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <span className="text-lg">🪵</span>
                  <span className="font-bold text-foreground">{upgrade.cost.wood}</span>
                </div>
              )}
              {upgrade.cost.stone > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <span className="text-lg">🪨</span>
                  <span className="font-bold text-foreground">{upgrade.cost.stone}</span>
                </div>
              )}
              {upgrade.cost.iron > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <span className="text-lg">⛏️</span>
                  <span className="font-bold text-foreground">{upgrade.cost.iron}</span>
                </div>
              )}
              {upgrade.cost.gold > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <span className="text-lg">🪙</span>
                  <span className="font-bold text-foreground">{upgrade.cost.gold}</span>
                </div>
              )}
              {upgrade.cost.balance > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/15 rounded-lg border-2 border-primary/30">
                  <span className="text-lg">💰</span>
                  <span className="font-bold text-primary">{upgrade.cost.balance} ELL</span>
                </div>
              )}
              {upgrade.cost.gt > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/15 rounded-lg border-2 border-primary/30">
                  <span className="text-lg">💎</span>
                  <span className="font-bold text-primary">{upgrade.cost.gt} GT</span>
                </div>
              )}
            </div>

            <div className="text-sm p-3 bg-accent/10 rounded-lg border-2 border-accent/30">
              <div className="flex items-start gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <div className="font-bold text-accent mb-1">{t(language, 'shelter.benefit')}:</div>
                  <div className="text-muted-foreground leading-relaxed">{upgrade.benefit}</div>
                </div>
              </div>
            </div>

            <Button
              className="w-full font-bold text-base py-6 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onUpgrade}
              disabled={(!canAfford && !isUpgradeReady) || (isUpgrading && !isUpgradeReady)}
              variant={isUpgradeReady ? "default" : undefined}
            >
              {isUpgradeReady 
                ? `✨ ${t(language, 'shelter.install')}` 
                : isUpgrading 
                  ? `⏳ ${t(language, 'shelter.upgrading')}` 
                  : upgrade.level === 0 
                    ? `🏗️ ${t(language, 'shelter.build')}`
                    : `⬆️ ${t(language, 'shelter.upgrade')}`
              }
            </Button>
          </div>
        )}

        {upgrade.level >= upgrade.maxLevel && (
          <Badge variant="default" className="w-full justify-center py-3 text-sm font-bold bg-gradient-to-r from-primary via-yellow-400 to-primary">
            ⭐ {t(language, 'shelter.maxLevel')} ⭐
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
