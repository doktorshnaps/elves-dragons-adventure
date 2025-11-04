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
              upgrade.level === 0 || (requiresWorkers && !hasWorkers) 
                ? 'grayscale' 
                : ''
            }`}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center text-7xl opacity-30 transition-all duration-300 ${
          upgrade.level === 0 || (requiresWorkers && !hasWorkers) 
            ? 'grayscale' 
            : ''
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
          {isUpgrading && upgradeProgress && (
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
            </div>
          )}

          {/* Workers Status */}
          {upgrade.id === 'main_hall' ? (
            <div className="flex items-center">
              <span className="font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-white text-base">
                👷 {activeWorkersCount}
              </span>
            </div>
          ) : requiresWorkers ? (
            <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg backdrop-blur-sm border ${
              hasWorkers 
                ? 'bg-success/20 text-success border-success/30' 
                : 'bg-warning/20 text-warning border-warning/30'
            }`}>
              <Users className="w-3 h-3 flex-shrink-0" />
              {hasWorkers ? (
                <span className="font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">👷 {activeWorkersCount}</span>
              ) : (
                <span className="font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{t(language, 'shelter.needWorkers')}</span>
              )}
            </div>
          ) : null}

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
