import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Coins } from 'lucide-react';
import { useResourceProduction } from '@/hooks/useResourceProduction';
import { getWarehouseWorkingHours } from '@/config/buildings';
import { useUnifiedGameState } from '@/hooks/useUnifiedGameState';

interface ResourceBuildingProps {
  type: 'sawmill' | 'quarry';
  name: string;
  icon: React.ReactNode;
  resourceType: 'wood' | 'stone';
}

export const ResourceBuilding: React.FC<ResourceBuildingProps> = ({
  type,
  name,
  icon,
  resourceType
}) => {
  const gameState = useUnifiedGameState();
  const {
    collectWood,
    collectStone,
    getWoodReady,
    getStoneReady,
    getTotalWoodPerHour,
    getTotalStonePerHour,
    getMaxWoodStorage,
    getMaxStoneStorage,
    getWoodProductionProgress,
    getStoneProductionProgress
  } = useResourceProduction();

  const [timeDisplay, setTimeDisplay] = useState<string>('');

  const buildingLevel = gameState?.buildingLevels?.[type] || 0;
  const warehouseLevel = gameState?.buildingLevels?.storage || 1;
  const isWood = resourceType === 'wood';
  const readyResources = isWood ? getWoodReady() : getStoneReady();
  const productionPerHour = isWood ? getTotalWoodPerHour() : getTotalStonePerHour();
  const maxStorage = isWood ? getMaxWoodStorage() : getMaxStoneStorage();
  const productionProgress = isWood ? getWoodProductionProgress() : getStoneProductionProgress();
  const workingHours = getWarehouseWorkingHours(warehouseLevel);

  console.log(`🏭 ResourceBuilding debug (${type}):`, {
    buildingLevel,
    warehouseLevel, 
    productionPerHour,
    maxStorage,
    readyResources,
    workingHours
  });
  

  // Обновление отображения времени до заполнения хранилища
  useEffect(() => {
    const interval = setInterval(() => {
      if (productionPerHour > 0 && maxStorage > 0) {
        const currentResources = readyResources;
        const remainingResources = maxStorage - currentResources;
        
        if (remainingResources <= 0) {
          setTimeDisplay('Хранилище полно');
        } else {
          const timeToFull = (remainingResources / productionPerHour) * 3600; // секунды
          const hours = Math.floor(timeToFull / 3600);
          const minutes = Math.floor((timeToFull % 3600) / 60);
          
          if (hours > 0) {
            setTimeDisplay(`${hours}ч ${minutes}м`);
          } else {
            setTimeDisplay(`${minutes}м`);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [productionPerHour, maxStorage, readyResources]);

  const handleCollect = async () => {
    if (isWood) {
      await collectWood();
    } else {
      await collectStone();
    }
  };


  if (buildingLevel === 0) {
    return null; // Не отображаем компонент если здание не построено
  }

  return (
    <div className="space-y-4">
      {/* Информация о хранилище и производстве */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Хранилище</span>
          <span className="text-sm text-muted-foreground">
            {readyResources}/{maxStorage}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">
          Производство: {productionPerHour}/час • Время работы: {workingHours}ч
        </div>
        
        <Progress value={productionProgress} className="mb-2" />
        
        {readyResources >= maxStorage ? (
          <Button 
            onClick={handleCollect}
            className="w-full"
            variant="default"
          >
            <Coins className="w-4 h-4 mr-2" />
            Собрать {readyResources} {resourceType === 'wood' ? 'дерева' : 'камня'}
          </Button>
        ) : (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {timeDisplay}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};