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
    woodProduction,
    stoneProduction,
    collectWood,
    collectStone,
    getWoodReady,
    getStoneReady,
    getTotalWoodPerHour,
    getTotalStonePerHour,
    getWoodProductionProgress,
    getStoneProductionProgress
  } = useResourceProduction();

  const [timeDisplay, setTimeDisplay] = useState<string>('');

  const buildingLevel = gameState?.buildingLevels?.[type] || 0;
  const warehouseLevel = gameState?.buildingLevels?.storage || 1;
  const isWood = resourceType === 'wood';
  const readyResources = isWood ? getWoodReady() : getStoneReady();
  const productionPerHour = isWood ? getTotalWoodPerHour() : getTotalStonePerHour();
  const productionProgress = isWood ? getWoodProductionProgress() : getStoneProductionProgress();
  const workingHours = getWarehouseWorkingHours(warehouseLevel);

  console.log(`🏭 ResourceBuilding debug (${type}):`, {
    buildingLevel,
    warehouseLevel, 
    productionPerHour,
    readyResources,
    workingHours,
    resourceType,
    isWood
  });
  

  // Обновление отображения времени до остановки производства
  useEffect(() => {
    const interval = setInterval(() => {
      if (productionPerHour > 0) {
        const lastCollectionTime = isWood ? 
          woodProduction.lastCollectionTime : 
          stoneProduction.lastCollectionTime;
        const timeElapsed = (Date.now() - lastCollectionTime) / 1000 / 3600;
        const remainingTime = workingHours - timeElapsed;
        
        if (remainingTime <= 0) {
          setTimeDisplay('Производство остановлено');
        } else {
          const hours = Math.floor(remainingTime);
          const minutes = Math.floor((remainingTime % 1) * 60);
          
          if (hours > 0) {
            setTimeDisplay(`${hours}ч ${minutes}м до остановки`);
          } else {
            setTimeDisplay(`${minutes}м до остановки`);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [productionPerHour, workingHours, woodProduction.lastCollectionTime, stoneProduction.lastCollectionTime, isWood]);

  const handleCollect = async () => {
    console.log(`🔧 COLLECT DEBUG: ${type} - ${resourceType} - isWood: ${isWood}`);
    if (isWood) {
      console.log('🪵 Collecting WOOD via collectWood()');
      await collectWood();
    } else {
      console.log('🪨 Collecting STONE via collectStone()');
      await collectStone();
    }
  };


  if (buildingLevel === 0) {
    return null; // Не отображаем компонент если здание не построено
  }

  return (
    <div className="space-y-4">
      {/* Информация о производстве без лимитов */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Готово к сбору</span>
          <span className="text-sm text-muted-foreground">
            {readyResources} {resourceType === 'wood' ? 'дерева' : 'камня'}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">
          Производство: {productionPerHour}/час • Время работы склада: {workingHours}ч
        </div>
        
        <Progress value={productionProgress} className="mb-2" />
        
        {/* Кнопка сбора всегда доступна если есть ресурсы */}
        {readyResources > 0 ? (
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
              {timeDisplay || 'Производство...'}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};