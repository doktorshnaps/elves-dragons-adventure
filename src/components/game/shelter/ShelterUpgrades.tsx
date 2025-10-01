import { BuildingCard } from "./BuildingCard";
import { BuildingWorkerStatus } from "./BuildingWorkerStatus";
import { ResourceBuilding } from "../ResourceBuilding";
import { NestUpgrade } from "@/hooks/shelter/useShelterState";
import { getWarehouseWorkingHours } from "@/config/buildings";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface ShelterUpgradesProps {
  upgrades: NestUpgrade[];
  canAffordUpgrade: (upgrade: NestUpgrade) => boolean;
  handleUpgrade: (upgrade: NestUpgrade) => void;
  isUpgrading: (buildingId: string) => boolean;
  getUpgradeProgress: (buildingId: string) => { progress: number; remainingTime: number } | null;
  formatRemainingTime: (ms: number) => string;
  hasWorkersInBuilding: (buildingId: string) => boolean;
  getActiveWorkersInBuilding: (buildingId: string) => any[];
  buildingLevels: Record<string, number>;
  getUpgradeTime: (buildingId: string) => number;
}

export const ShelterUpgrades = ({
  upgrades,
  canAffordUpgrade,
  handleUpgrade,
  isUpgrading,
  getUpgradeProgress,
  formatRemainingTime,
  hasWorkersInBuilding,
  getActiveWorkersInBuilding,
  buildingLevels,
  getUpgradeTime
}: ShelterUpgradesProps) => {
  const { language } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {upgrades.map((upgrade) => {
        const activeWorkers = getActiveWorkersInBuilding(upgrade.id);
        const hasWorkers = hasWorkersInBuilding(upgrade.id);
        
        return (
          <BuildingCard
            key={upgrade.id}
            upgrade={upgrade}
            canAfford={canAffordUpgrade(upgrade)}
            isUpgrading={isUpgrading(upgrade.id)}
            upgradeProgress={getUpgradeProgress(upgrade.id)}
            hasWorkers={hasWorkers}
            activeWorkersCount={activeWorkers.length}
            onUpgrade={() => handleUpgrade(upgrade)}
            formatRemainingTime={formatRemainingTime}
          >
            {/* Особая логика для разных типов зданий */}
            {upgrade.id === 'sawmill' && buildingLevels.sawmill > 0 && (
              <ResourceBuilding
                type="sawmill"
                name="Лесопилка"
                icon={<span>🪵</span>}
                resourceType="wood"
                hasActiveWorkers={hasWorkers}
              />
            )}

            {upgrade.id === 'quarry' && buildingLevels.quarry > 0 && (
              <ResourceBuilding
                type="quarry"
                name="Каменоломня"
                icon={<span>🪨</span>}
                resourceType="stone"
                hasActiveWorkers={hasWorkers}
              />
            )}

            {upgrade.id === 'storage' && (
              <div className="text-sm space-y-1 p-2 bg-muted/50 rounded">
                <div>{t(language, 'shelter.storageCapacity')}: {getWarehouseWorkingHours(buildingLevels.storage)} {t(language, 'shelter.hours')}</div>
              </div>
            )}

            {(upgrade.id === 'workshop' || upgrade.id === 'sawmill' || upgrade.id === 'quarry') && activeWorkers.length > 0 && (
              <BuildingWorkerStatus
                buildingId={upgrade.id}
                activeWorkers={activeWorkers}
              />
            )}
          </BuildingCard>
        );
      })}
    </div>
  );
};
