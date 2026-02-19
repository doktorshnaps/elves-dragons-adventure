import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, Users, Zap } from "lucide-react";
import { NestUpgrade } from "@/hooks/shelter/useShelterState";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface BuildingGridCardProps {
  upgrade: NestUpgrade;
  isSelected: boolean;
  isUpgrading: boolean;
  upgradeProgress: { progress: number; remainingTime: number } | null;
  hasWorkers: boolean;
  activeWorkersCount: number;
  onClick: () => void;
  formatRemainingTime: (ms: number) => string;
  productionData?: {
    readyResources: number;
    maxCapacity: number;
    productionProgress: number;
    onCollect: () => Promise<void>;
  };
  workersLoaded: boolean;
  gameLoaded: boolean;
  onInstantComplete?: () => void;
}

export const BuildingGridCard = ({
  upgrade,
  isSelected,
  isUpgrading,
  upgradeProgress,
  hasWorkers,
  activeWorkersCount,
  onClick,
  formatRemainingTime,
  productionData,
  workersLoaded,
  gameLoaded,
  onInstantComplete
}: BuildingGridCardProps) => {
  const { language } = useLanguage();
  const { isAdmin } = useAdminCheck();
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  
  const isResourceBuilding = upgrade.id === 'sawmill' || upgrade.id === 'quarry';
  const canCollect = productionData && productionData.readyResources > 0 && productionData.productionProgress >= 100 && hasWorkers;
  
  // Здания, которые НЕ требуют рабочих для работы
  const buildingsWithoutWorkers = ['storage', 'main_hall'];
  const requiresWorkers = !buildingsWithoutWorkers.includes(upgrade.id);
  
  // Серый фильтр применяется только когда загружены работники и игровые данные
  const shouldBeGrayscale = (workersLoaded && gameLoaded) && (
    upgrade.level === 0 || (requiresWorkers && !hasWorkers)
  );

  const handleInstantComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!accountId || !isAdmin || !isUpgrading) return;
    
    setIsCompleting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('instant-complete-building', {
        body: {
          wallet_address: accountId,
          building_id: upgrade.id
        }
      });

      if (error) throw error;

      console.log('✅ [instant-complete] Building upgraded:', upgrade.id, 'to level', data.new_level);

      toast({
        title: "⚡ Постройка завершена",
        description: `${upgrade.name} мгновенно улучшен до уровня ${data.new_level}`,
      });

      // Вызываем onInstantComplete чтобы перезагрузить данные из БД.
      // После этого useBuildingUpgrades увидит пустой activeBuildingUpgrades из БД
      // и очистит локальный state, убрав индикатор "улучшается".
      if (onInstantComplete) {
        // Небольшая задержка чтобы БД успела записать изменения
        await new Promise(resolve => setTimeout(resolve, 300));
        await onInstantComplete();
      }
    } catch (error: any) {
      console.error('Failed to instant complete:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось завершить постройку",
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card 
      variant="glassmorphic"
      className={`
        group cursor-pointer relative overflow-hidden min-h-[240px] 
        transition-all duration-300 hover:-translate-y-1
        ${isSelected ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(251,191,36,0.4)]' : ''}
        ${isUpgrading ? 'animate-pulse-slow' : ''}
      `}
      onClick={onClick}
    >
      {/* Background image for entire card */}
      {upgrade.backgroundImageUrl ? (
        <>
          <img 
            src={upgrade.backgroundImageUrl} 
            alt={upgrade.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
              shouldBeGrayscale ? 'grayscale' : ''
            }`}
          />
          {/* Subtle overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center text-7xl opacity-30 transition-all duration-300 ${
          shouldBeGrayscale ? 'grayscale' : ''
        }`}>
          {upgrade.id === 'main_hall' && '🏛️'}
          {upgrade.id === 'storage' && '📦'}
          {upgrade.id === 'workshop' && '⚒️'}
          {upgrade.id === 'sawmill' && '🪵'}
          {upgrade.id === 'quarry' && '🪨'}
          {upgrade.id === 'barracks' && '🛡️'}
          {upgrade.id === 'dragon_lair' && '🐉'}
          {upgrade.id === 'medical' && '💊'}
          {!['main_hall', 'storage', 'workshop', 'sawmill', 'quarry', 'barracks', 'dragon_lair', 'medical'].includes(upgrade.id) && '🏗️'}
        </div>
      )}

      {/* Production indicator */}
      {isUpgrading && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-success text-white text-[10px] font-bold rounded-full animate-pulse-slow z-10">
          {t(language, 'shelter.producing') || 'Производство'}
        </div>
      )}

      <div className="relative z-10 p-4 flex flex-col justify-between h-full">
        {/* Top section */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-primary transition-colors">
              {upgrade.name}
            </h3>
            <Badge 
              variant="default" 
              className="text-xs font-bold bg-primary text-primary-foreground shadow-lg"
            >
              Ур. {upgrade.level}
            </Badge>
          </div>

          {/* Upgrade Progress */}
          {isUpgrading && upgradeProgress && upgrade.level < upgrade.maxLevel && (
            <div className="space-y-2 bg-black/40 backdrop-blur-sm rounded-lg p-2 border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  <Clock className="w-3 h-3 text-primary" />
                  <span className="font-medium">{t(language, 'shelter.upgrading')}</span>
                </span>
                <span className="font-bold text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {formatRemainingTime(upgradeProgress.remainingTime)}
                </span>
              </div>
              <Progress value={upgradeProgress.progress} className="h-1.5" />
              
              {/* Admin: Instant Complete Button */}
              {isAdmin && (
                <Button
                  onClick={handleInstantComplete}
                  disabled={isCompleting}
                  size="sm"
                  className="w-full h-7 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {isCompleting ? 'Завершение...' : '⚡ Мгновенно завершить'}
                </Button>
              )}
            </div>
          )}

          {/* Production Progress for Resource Buildings */}
          {isResourceBuilding && productionData && upgrade.level > 0 && (
            <div className="space-y-2 bg-black/40 backdrop-blur-sm rounded-lg p-2 border border-white/10">
              {hasWorkers ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-medium">
                      {t(language, 'shelter.production') || 'Добыча'}
                    </span>
                    <span className="font-bold text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {Math.floor(productionData.readyResources)} / {productionData.maxCapacity}
                    </span>
                  </div>
                  <Progress value={productionData.productionProgress} className="h-1.5" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canCollect) {
                        productionData.onCollect();
                      }
                    }}
                    disabled={!canCollect}
                    className={`w-full py-1.5 px-3 font-semibold rounded-lg text-xs transition-colors ${
                      canCollect 
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    }`}
                  >
                    {t(language, 'shelter.collect') || 'Собрать'}
                  </button>
                </>
              ) : (
                <div className="text-xs text-white/70 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {t(language, 'shelter.assignWorkers')}
                </div>
              )}
            </div>
          )}

          {/* Workers Status */}
          <div className="flex items-center">
            <span className="font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-white text-base">
              👷 {activeWorkersCount}
            </span>
          </div>

          {/* Max Level Badge */}
          {upgrade.level >= upgrade.maxLevel && (
            <Badge variant="default" className="w-full justify-center text-xs bg-gradient-to-r from-primary to-yellow-400 shadow-lg">
              ⭐ MAX
            </Badge>
          )}
        </div>

        {/* Bottom section - Progress Bar */}
        <div className="w-full flex gap-1 mt-3">
          {Array.from({ length: upgrade.maxLevel }).map((_, index) => (
            <div 
              key={index}
              className="flex-1 h-2 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden border border-white/10"
            >
              {index < upgrade.level && (
                <div className="w-full h-full bg-gradient-to-r from-primary to-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse-slow" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
