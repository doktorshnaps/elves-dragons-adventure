import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users } from "lucide-react";
import { NestUpgrade } from "@/hooks/shelter/useShelterState";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface BuildingGridCardProps {
  upgrade: NestUpgrade;
  isSelected: boolean;
  isUpgrading: boolean;
  upgradeProgress: { progress: number; remainingTime: number } | null;
  hasWorkers: boolean;
  activeWorkersCount: number;
  onClick: () => void;
  formatRemainingTime: (ms: number) => string;
}

export const BuildingGridCard = ({
  upgrade,
  isSelected,
  isUpgrading,
  upgradeProgress,
  hasWorkers,
  activeWorkersCount,
  onClick,
  formatRemainingTime
}: BuildingGridCardProps) => {
  const { language } = useLanguage();
  const requiresWorkers = upgrade.id !== 'main_hall' && upgrade.id !== 'storage';

  return (
    <Card 
      variant="glassmorphic"
      className={`
        group cursor-pointer relative overflow-hidden min-h-[200px] 
        transition-all duration-300 hover:-translate-y-1
        ${isSelected ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(251,191,36,0.4)]' : ''}
        ${isUpgrading ? 'animate-pulse-slow' : ''}
      `}
      onClick={onClick}
    >
      {/* Production indicator */}
      {isUpgrading && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-success text-white text-[10px] font-bold rounded-full animate-pulse-slow z-10">
          {t(language, 'shelter.producing') || 'Производство'}
        </div>
      )}

      {/* Building image */}
      <div 
        className="w-full h-32 bg-gradient-to-br from-muted/40 to-muted/20 border-b border-border mb-3 flex items-center justify-center text-5xl relative overflow-hidden"
      >
        {upgrade.backgroundImageUrl ? (
          <img 
            src={upgrade.backgroundImageUrl} 
            alt={upgrade.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            {upgrade.id === 'main_hall' && '🏛️'}
            {upgrade.id === 'storage' && '📦'}
            {upgrade.id === 'workshop' && '⚒️'}
            {upgrade.id === 'sawmill' && '🪵'}
            {upgrade.id === 'quarry' && '🪨'}
            {upgrade.id === 'barracks' && '🛡️'}
            {upgrade.id === 'dragon_lair' && '🐉'}
            {upgrade.id === 'medical' && '💊'}
            {!['main_hall', 'storage', 'workshop', 'sawmill', 'quarry', 'barracks', 'dragon_lair', 'medical'].includes(upgrade.id) && '🏗️'}
          </>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {upgrade.name}
          </h3>
          <Badge 
            variant="default" 
            className="text-xs font-bold bg-primary text-primary-foreground"
          >
            Ур. {upgrade.level}
          </Badge>
        </div>

        {/* Level Progress Bar */}
        {upgrade.level > 0 && upgrade.level < upgrade.maxLevel && (
          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-yellow-400 transition-all duration-500"
              style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%` }}
            />
          </div>
        )}

        {/* Upgrade Progress */}
        {isUpgrading && upgradeProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                <span className="font-medium">{t(language, 'shelter.upgrading')}</span>
              </span>
              <span className="font-bold text-primary">
                {formatRemainingTime(upgradeProgress.remainingTime)}
              </span>
            </div>
            <Progress value={upgradeProgress.progress} className="h-1.5" />
          </div>
        )}

        {/* Workers Status */}
        {requiresWorkers && (
          <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
            hasWorkers 
              ? 'bg-success/10 text-success' 
              : 'bg-warning/10 text-warning'
          }`}>
            <Users className="w-3 h-3 flex-shrink-0" />
            {hasWorkers ? (
              <span className="font-medium">👷 {activeWorkersCount}</span>
            ) : (
              <span className="font-medium">{t(language, 'shelter.needWorkers')}</span>
            )}
          </div>
        )}

        {/* Max Level Badge */}
        {upgrade.level >= upgrade.maxLevel && (
          <Badge variant="default" className="w-full justify-center text-xs bg-gradient-to-r from-primary to-yellow-400">
            ⭐ MAX
          </Badge>
        )}
      </div>
    </Card>
  );
};
