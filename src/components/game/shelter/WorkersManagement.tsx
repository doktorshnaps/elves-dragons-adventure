import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
import { useCardInstances } from "@/hooks/useCardInstances";
import { Item } from "@/types/inventory";
import { Users, Clock, Zap, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActiveWorker {
  id: string;
  workerId: string;
  cardInstanceId: string;
  name: string;
  speedBoost: number;
  startTime: number;
  duration: number;
  building: string;
}

interface WorkersManagementProps {
  onSpeedBoostChange?: (totalBoost: number) => void;
}

export const WorkersManagement = ({ onSpeedBoostChange }: WorkersManagementProps) => {
  const { gameData, updateGameData } = useGameData();
  const { cardInstances, deleteCardInstance } = useCardInstances();
  const { toast } = useToast();
  const [activeWorkers, setActiveWorkers] = useState<ActiveWorker[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("main_hall");

  // Функция для обновления активных рабочих в базе данных
  const updateActiveWorkersInDB = async (workers: ActiveWorker[]) => {
    const walletAddress = localStorage.getItem('walletAccountId');
    if (!walletAddress) return;

    try {
      const { error } = await supabase
        .from('game_data')
        .update({ active_workers: workers as any })
        .eq('wallet_address', walletAddress);
      
      if (error) {
        console.error('Failed to update active workers:', error);
      }
    } catch (error) {
      console.error('Error updating active workers:', error);
    }
  };

  const buildings = [
    { id: "main_hall", name: "Главный зал" },
    { id: "workshop", name: "Мастерская" },
    { id: "storage", name: "Склад" },
    { id: "sawmill", name: "Лесопилка" },
    { id: "quarry", name: "Каменоломня" },
    { id: "dragon_lair", name: "Драконье Логово" }
  ];

  // Получаем рабочих из card_instances
  const availableWorkers = cardInstances.filter(
    instance => instance.card_type === "workers"
  ).map(instance => {
    const cardData = instance.card_data as any;
    return {
      id: instance.id,
      name: cardData.name || 'Рабочий',
      description: cardData.description || '',
      type: cardData.type || 'worker',
      value: cardData.value || 0,
      stats: cardData.stats || {},
      image: cardData.image
    };
  });

  // Загружаем активных рабочих из gameData
  useEffect(() => {
    if (gameData.activeWorkers) {
      setActiveWorkers(gameData.activeWorkers);
    }
  }, [gameData.activeWorkers]);

  // Синхронизируем изменения с базой данных
  useEffect(() => {
    // Обновляем базу данных при изменении активных рабочих
    if (activeWorkers.length > 0 || gameData.activeWorkers?.length > 0) {
      updateActiveWorkersInDB(activeWorkers);
      updateGameData({ activeWorkers });
    }
    
    // Вычисляем общее ускорение
    const totalBoost = activeWorkers.reduce((sum, worker) => sum + worker.speedBoost, 0);
    onSpeedBoostChange?.(totalBoost);
  }, [activeWorkers, onSpeedBoostChange]);

  // Проверяем завершенных рабочих каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveWorkers(prev => {
        const stillWorking = prev.filter(worker => {
          const isFinished = now >= worker.startTime + worker.duration;
          if (isFinished) {
            // Удаляем card_instance рабочего из базы данных
            deleteCardInstance(worker.cardInstanceId);
            toast({
              title: "Работа завершена",
              description: `${worker.name} завершил работу в здании "${buildings.find(b => b.id === worker.building)?.name}" и исчез`,
            });
          }
          return !isFinished;
        });
        
        // Обновляем базу данных если список изменился
        if (stillWorking.length !== prev.length) {
          updateActiveWorkersInDB(stillWorking);
          updateGameData({ activeWorkers: stillWorking });
          console.log('🔄 Updated active workers after completion:', stillWorking);
        }
        
        return stillWorking;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [toast, buildings, deleteCardInstance, updateGameData]);

  const assignWorker = async (worker: any) => {
    if (!worker.stats?.workDuration) return;

    const newActiveWorker: ActiveWorker = {
      id: `${worker.id}_${Date.now()}`,
      workerId: worker.id,
      cardInstanceId: worker.id, // ID card_instance
      name: worker.name,
      speedBoost: worker.value,
      startTime: Date.now(),
      duration: worker.stats.workDuration,
      building: selectedBuilding
    };

    const updatedActiveWorkers = [...activeWorkers, newActiveWorker];
    setActiveWorkers(updatedActiveWorkers);

    // Сразу обновляем состояние игры и базу данных
    try {
      await updateGameData({ activeWorkers: updatedActiveWorkers });
      await updateActiveWorkersInDB(updatedActiveWorkers);
      
      console.log('✅ Worker assigned and saved:', newActiveWorker);
      
      toast({
        title: "Рабочий назначен",
        description: `${worker.name} приступил к работе в здании "${buildings.find(b => b.id === selectedBuilding)?.name}"`,
      });
    } catch (error) {
      console.error('❌ Failed to save worker assignment:', error);
      // Откатываем изменения при ошибке
      setActiveWorkers(activeWorkers);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить рабочего. Попробуйте снова.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = (worker: ActiveWorker) => {
    const now = Date.now();
    const elapsed = now - worker.startTime;
    return Math.min(100, (elapsed / worker.duration) * 100);
  };

  const getRemainingTime = (worker: ActiveWorker) => {
    const now = Date.now();
    const elapsed = now - worker.startTime;
    return Math.max(0, worker.duration - elapsed);
  };

  const totalSpeedBoost = activeWorkers.reduce((sum, worker) => sum + worker.speedBoost, 0);

  return (
    <div className="space-y-6">
      {/* Общая информация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Управление рабочими
          </CardTitle>
          <CardDescription>
            Назначайте рабочих на здания для ускорения их работы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">
                Общее ускорение: +{totalSpeedBoost}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Активных рабочих: {activeWorkers.length}
              </span>
            </div>
          </div>
          
          {totalSpeedBoost > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Все здания работают быстрее благодаря рабочим!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Активные рабочие */}
      {activeWorkers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Активные рабочие</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeWorkers.map(worker => (
                <div key={worker.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{worker.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {buildings.find(b => b.id === worker.building)?.name} • +{worker.speedBoost}% ускорение
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {formatTime(getRemainingTime(worker))}
                    </Badge>
                  </div>
                  <Progress value={getProgress(worker)} className="w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Назначение новых рабочих */}
      <Card>
        <CardHeader>
          <CardTitle>Назначить рабочего</CardTitle>
          <CardDescription>
            Выберите здание и назначьте рабочего. После назначения отменить нельзя!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Выбор здания */}
            <div>
              <label className="text-sm font-medium mb-2 block">Здание:</label>
              <div className="grid grid-cols-2 gap-2">
                {buildings.map(building => (
                  <Button
                    key={building.id}
                    variant={selectedBuilding === building.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBuilding(building.id)}
                    className="justify-start"
                  >
                    {building.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Доступные рабочие */}
            <div>
              <label className="text-sm font-medium mb-2 block">Доступные рабочие:</label>
              {availableWorkers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>У вас нет рабочих в инвентаре</p>
                  <p className="text-sm">Купите их в Магическом магазине</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {availableWorkers.map(worker => (
                    <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{worker.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          +{worker.value}% ускорение • {formatTime(worker.stats?.workDuration || 0)}
                        </p>
                        {worker.description && (
                          <p className="text-xs text-muted-foreground mt-1">{worker.description}</p>
                        )}
                      </div>
                      <Button 
                        onClick={() => assignWorker(worker)}
                        size="sm"
                        className="shrink-0"
                      >
                        Назначить
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {availableWorkers.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Внимание:</strong> После назначения рабочего на здание отменить это действие нельзя. 
                  По окончанию работы рабочий исчезнет навсегда.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};