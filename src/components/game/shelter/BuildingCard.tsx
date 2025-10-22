import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Users } from "lucide-react";
import { NestUpgrade } from "@/hooks/shelter/useShelterState";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

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
  const requiresWorkers = upgrade.id !== 'main_hall' && upgrade.id !== 'storage';

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{upgrade.name}</CardTitle>
          <Badge variant="secondary" className="text-sm">
            {t(language, 'shelter.level')} {upgrade.level}/{upgrade.maxLevel}
          </Badge>
        </div>
        <CardDescription className="text-sm">{upgrade.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Прогресс апгрейда */}
        {isUpgrading && upgradeProgress && (
          <div className="space-y-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t(language, 'shelter.upgrading')}
              </span>
              <span className="font-medium">
                {formatRemainingTime(upgradeProgress.remainingTime)}
              </span>
            </div>
            <Progress value={upgradeProgress.progress} className="h-2" />
          </div>
        )}

        {/* Статус рабочих */}
        {requiresWorkers && (
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${hasWorkers ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
            <Users className="w-4 h-4" />
            {hasWorkers ? (
              <span>{t(language, 'shelter.workersActive')}: {activeWorkersCount}</span>
            ) : (
              <span>{t(language, 'shelter.needWorkers')}</span>
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
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-sm">
                <span className="text-amber-600">
                  {t(language, 'shelter.requiresMainHall')}: {upgrade.requiredMainHallLevel}
                </span>
              </div>
            )}

            {/* Требуемые предметы */}
            {upgrade.requiredItems && upgrade.requiredItems.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {t(language, 'shelter.requiredItems')}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {upgrade.requiredItems.map((item, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {item.item_id} x{item.quantity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ресурсы */}
            <div className="grid grid-cols-2 gap-2">
              {upgrade.cost.wood > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>🪵</span>
                  <span>{upgrade.cost.wood}</span>
                </div>
              )}
              {upgrade.cost.stone > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>🪨</span>
                  <span>{upgrade.cost.stone}</span>
                </div>
              )}
              {upgrade.cost.iron > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>⛏️</span>
                  <span>{upgrade.cost.iron}</span>
                </div>
              )}
              {upgrade.cost.gold > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>🪙</span>
                  <span>{upgrade.cost.gold}</span>
                </div>
              )}
              {upgrade.cost.balance > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>💰</span>
                  <span>{upgrade.cost.balance} ELL</span>
                </div>
              )}
              {upgrade.cost.gt > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>💎</span>
                  <span>{upgrade.cost.gt} GT</span>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
              <strong>{t(language, 'shelter.benefit')}:</strong> {upgrade.benefit}
            </div>

            <Button
              className="w-full"
              onClick={onUpgrade}
              disabled={(!canAfford && !isUpgradeReady) || (isUpgrading && !isUpgradeReady)}
              variant={isUpgradeReady ? "default" : undefined}
            >
              {isUpgradeReady 
                ? t(language, 'shelter.install') 
                : isUpgrading 
                  ? t(language, 'shelter.upgrading') 
                  : upgrade.level === 0 
                    ? t(language, 'shelter.build')
                    : t(language, 'shelter.upgrade')
              }
            </Button>
          </div>
        )}

        {upgrade.level >= upgrade.maxLevel && (
          <Badge variant="default" className="w-full justify-center py-2">
            {t(language, 'shelter.maxLevel')}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
