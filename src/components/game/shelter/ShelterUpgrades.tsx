import { useState } from "react";
import { BuildingGridCard } from "./BuildingGridCard";
import { BuildingDetailsPanel } from "./BuildingDetailsPanel";
import { InventoryPanel } from "./InventoryPanel";
import { NestUpgrade } from "@/hooks/shelter/useShelterState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useResourceProduction } from "@/hooks/useResourceProduction";
interface ShelterUpgradesProps {
  upgrades: NestUpgrade[];
  canAffordUpgrade: (upgrade: NestUpgrade) => boolean;
  handleUpgrade: (upgrade: NestUpgrade) => void;
  isUpgrading: (buildingId: string) => boolean;
  getUpgradeProgress: (buildingId: string) => {
    progress: number;
    remainingTime: number;
  } | null;
  formatRemainingTime: (ms: number) => string;
  hasWorkersInBuilding: (buildingId: string) => boolean;
  getActiveWorkersInBuilding: (buildingId: string) => any[];
  buildingLevels: Record<string, number>;
  getUpgradeTime: (buildingId: string) => number;
  isUpgradeReady: (buildingId: string) => boolean;
  resources?: {
    wood: number;
    stone: number;
  };
  inventoryCounts?: Record<string, number>;
  workersLoaded: boolean;
  gameLoaded: boolean;
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
  isUpgradeReady,
  resources,
  inventoryCounts,
  workersLoaded,
  gameLoaded
}: ShelterUpgradesProps) => {
  const [selectedBuilding, setSelectedBuilding] = useState<NestUpgrade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const {
    getWoodReady,
    getStoneReady,
    getWoodProductionProgress,
    getStoneProductionProgress,
    collectWood,
    collectStone,
    getMaxWoodCapacity,
    getMaxStoneCapacity
  } = useResourceProduction();
  const handleBuildingClick = (building: NestUpgrade) => {
    setSelectedBuilding(building);
    setIsDialogOpen(true);
  };
  return <>
      <div className="flex gap-6">
        {/* Left Panel - Inventory (скрыта на малых экранах) */}
        

        {/* Center - Buildings Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upgrades.map(upgrade => {
            const activeWorkers = getActiveWorkersInBuilding(upgrade.id);
            const hasWorkers = hasWorkersInBuilding(upgrade.id);
            
            // Production data for resource buildings
            const productionData = upgrade.id === 'sawmill' ? {
              readyResources: getWoodReady(hasWorkers),
              maxCapacity: getMaxWoodCapacity(),
              productionProgress: getWoodProductionProgress(hasWorkers),
              onCollect: collectWood
            } : upgrade.id === 'quarry' ? {
              readyResources: getStoneReady(hasWorkers),
              maxCapacity: getMaxStoneCapacity(),
              productionProgress: getStoneProductionProgress(hasWorkers),
              onCollect: collectStone
            } : undefined;
            
            return <BuildingGridCard 
              key={upgrade.id} 
              upgrade={upgrade} 
              isSelected={selectedBuilding?.id === upgrade.id} 
              isUpgrading={isUpgrading(upgrade.id)} 
              upgradeProgress={getUpgradeProgress(upgrade.id)} 
              hasWorkers={hasWorkers} 
              activeWorkersCount={activeWorkers.length} 
              onClick={() => handleBuildingClick(upgrade)} 
              formatRemainingTime={formatRemainingTime}
              productionData={productionData}
              workersLoaded={workersLoaded}
              gameLoaded={gameLoaded}
            />;
          })}
          </div>
        </div>
      </div>

      {/* Dialog для деталей здания */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {selectedBuilding?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedBuilding?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <BuildingDetailsPanel 
              selectedBuilding={selectedBuilding} 
              canAfford={selectedBuilding ? canAffordUpgrade(selectedBuilding) : false} 
              isUpgrading={selectedBuilding ? isUpgrading(selectedBuilding.id) : false} 
              inventoryCounts={inventoryCounts || {}}
              buildingLevels={buildingLevels}
              onUpgrade={() => {
                if (selectedBuilding) {
                  handleUpgrade(selectedBuilding);
                  setIsDialogOpen(false);
                }
              }} 
              isUpgradeReady={selectedBuilding ? isUpgradeReady(selectedBuilding.id) : false}
              insideDialog={true} 
              resources={resources} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>;
};