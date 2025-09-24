import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Hammer, Clock, Coins } from 'lucide-react';
import { useResourceProduction } from '@/hooks/useResourceProduction';
import { getSawmillUpgradeCost, getQuarryUpgradeCost } from '@/config/buildings';
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
    getTotalStonePerHour
  } = useResourceProduction();

  const [timeDisplay, setTimeDisplay] = useState<string>('');

  const buildingLevel = gameState?.buildingLevels?.[type] || 0;
  const isWood = resourceType === 'wood';
  const readyResources = isWood ? getWoodReady() : getStoneReady();
  const productionPerHour = isWood ? getTotalWoodPerHour() : getTotalStonePerHour();
  
  const upgradeCost = isWood 
    ? getSawmillUpgradeCost(buildingLevel)
    : getQuarryUpgradeCost(buildingLevel);

  const canUpgrade = upgradeCost && buildingLevel < 8;
  const canAffordUpgrade = canUpgrade && 
    (gameState?.wood || 0) >= upgradeCost.wood && 
    (gameState?.stone || 0) >= upgradeCost.stone;

  // Обновление отображения времени
  useEffect(() => {
    const interval = setInterval(() => {
      if (productionPerHour > 0) {
        const timeForNextResource = 3600 / productionPerHour; // секунды на 1 ресурс
        const minutes = Math.floor(timeForNextResource / 60);
        const seconds = Math.floor(timeForNextResource % 60);
        setTimeDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [productionPerHour]);

  const handleCollect = async () => {
    if (isWood) {
      await collectWood();
    } else {
      await collectStone();
    }
  };

  const handleUpgrade = async () => {
    if (!canAffordUpgrade || !upgradeCost) return;

    try {
      await gameState.actions.updateResources({
        wood: (gameState?.wood || 0) - upgradeCost.wood,
        stone: (gameState?.stone || 0) - upgradeCost.stone
      });

      // Обновляем уровень здания
      await gameState.actions.batchUpdate({
        buildingLevels: {
          ...gameState?.buildingLevels,
          [type]: buildingLevel + 1
        }
      });
    } catch (error) {
      console.error('Ошибка при улучшении здания:', error);
    }
  };

  if (buildingLevel === 0) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">Здание не построено</p>
            <p className="text-sm text-muted-foreground">
              Постройте здание в разделе улучшений
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {icon}
            {name}
          </div>
          <Badge variant="secondary">Ур. {buildingLevel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Производство */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Производство</span>
            <span className="text-sm text-muted-foreground">{productionPerHour}/час</span>
          </div>
          
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
                Следующий ресурс через {timeDisplay}
              </div>
              <Progress value={0} className="mt-2" />
            </div>
          )}
        </div>

        {/* Улучшение */}
        {canUpgrade && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Улучшение</span>
              <Badge variant="outline">Ур. {buildingLevel + 1}</Badge>
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Дерево:</span>
                <span className={`${(gameState?.wood || 0) >= upgradeCost.wood ? 'text-green-600' : 'text-red-600'}`}>
                  {upgradeCost.wood.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Камень:</span>
                <span className={`${(gameState?.stone || 0) >= upgradeCost.stone ? 'text-green-600' : 'text-red-600'}`}>
                  {upgradeCost.stone.toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              onClick={handleUpgrade}
              disabled={!canAffordUpgrade}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Hammer className="w-4 h-4 mr-2" />
              Улучшить
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};