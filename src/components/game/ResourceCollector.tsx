import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useResourceCollection } from '@/hooks/useResourceCollection';
import { useState } from 'react';

/**
 * Демонстрационный компонент для тестирования батчинга ресурсов
 * Показывает, как множественные клики группируются в один запрос
 */
export const ResourceCollector = () => {
  const { collectWood, collectStone, currentWood, currentStone } = useResourceCollection();
  const [clickCount, setClickCount] = useState({ wood: 0, stone: 0 });
  
  const handleCollectWood = () => {
    collectWood(10);
    setClickCount(prev => ({ ...prev, wood: prev.wood + 1 }));
  };
  
  const handleCollectStone = () => {
    collectStone(5);
    setClickCount(prev => ({ ...prev, stone: prev.stone + 1 }));
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Сбор ресурсов (с батчингом)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🪵</div>
            <div className="font-semibold">{currentWood}</div>
            <div className="text-xs text-muted-foreground">Кликов: {clickCount.wood}</div>
            <Button onClick={handleCollectWood} size="sm" className="mt-2 w-full">
              +10
            </Button>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">🪨</div>
            <div className="font-semibold">{currentStone}</div>
            <div className="text-xs text-muted-foreground">Кликов: {clickCount.stone}</div>
            <Button onClick={handleCollectStone} size="sm" className="mt-2 w-full">
              +5
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
          💡 Множественные клики группируются в один запрос к БД!
          <br />
          Проверь Network tab - запросы батчируются с задержкой 500мс
        </div>
      </CardContent>
    </Card>
  );
};
