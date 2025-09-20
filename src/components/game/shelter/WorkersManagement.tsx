import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUnifiedGameState } from "@/hooks/useUnifiedGameState";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useCentralizedCardInstances } from "@/hooks/useCentralizedCardInstances";

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
  const gameState = useUnifiedGameState();
  const { language } = useLanguage();
  const { cardInstances, loading: cardInstancesLoading, deleteCardInstance } = useCentralizedCardInstances();
  
  const { toast } = useToast();
  const [activeWorkers, setActiveWorkers] = useState<ActiveWorker[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("main_hall");

  const updateActiveWorkersInDB = async (workers: ActiveWorker[]) => {
    const walletAddress = localStorage.getItem('walletAccountId');
    if (!walletAddress) return;

    try {
      const { error } = await supabase.rpc('update_active_workers_by_wallet', { 
        p_wallet_address: walletAddress,
        p_active_workers: workers as any 
      });
      
      if (error) {
        console.error('Failed to update active workers:', error);
      }
    } catch (error) {
      console.error('Error updating active workers:', error);
    }
  };
  
  const buildings = [
    { id: "main_hall", name: t(language, 'shelter.mainHall') },
    { id: "workshop", name: t(language, 'shelter.workshop') },
    { id: "storage", name: t(language, 'shelter.storage') },
    { id: "sawmill", name: t(language, 'shelter.sawmill') },
    { id: "quarry", name: t(language, 'shelter.quarry') },
    { id: "barracks", name: t(language, 'shelter.barracksBuilding') },
    { id: "dragon_lair", name: t(language, 'shelter.dragonLairBuilding') },
    { id: "medical", name: t(language, 'shelter.medicalBuilding') }
  ];

  // Получаем рабочих из card_instances (где они сохраняются после покупки)
  const availableWorkers = cardInstances
    .filter((instance) => instance.card_type === 'workers')
    .map((instance) => {
      const cardData = instance.card_data as any;
      return {
        id: instance.id,
        cardInstanceId: instance.id,
        name: cardData?.name || 'Рабочий',
        description: cardData?.description || '',
        type: 'worker',
        value: cardData?.value || 0,
        stats: cardData?.stats || {},
        image: cardData?.image
      };
    });

  console.log('🔍 Available workers:', availableWorkers);

  // Загружаем активных рабочих из gameState
  useEffect(() => {
    if (gameState.activeWorkers) {
      setActiveWorkers(gameState.activeWorkers);
    }
  }, [gameState.activeWorkers]);

  // Вычисляем общее ускорение при изменении активных рабочих
  useEffect(() => {
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
           gameState.actions.batchUpdate({ activeWorkers: stillWorking }).catch(console.error);
           console.log('🔄 Updated active workers after completion:', stillWorking);
         }
        
        return stillWorking;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [toast, buildings, gameState.actions]);

  const assignWorker = async (worker: any) => {
    if (!worker.stats?.workDuration) return;

    const newActiveWorker: ActiveWorker = {
      id: `${worker.id}_${Date.now()}`,
      workerId: worker.id,
      cardInstanceId: worker.cardInstanceId,
      name: worker.name,
      speedBoost: worker.value,
      startTime: Date.now(),
      duration: worker.stats.workDuration,
      building: selectedBuilding
    };

    const updatedActiveWorkers = [...activeWorkers, newActiveWorker];

    // Сразу обновляем состояние игры и базу данных
     try {
       // Обновляем локальное состояние
       setActiveWorkers(updatedActiveWorkers);

        // Удаляем card_instance рабочего (после назначения он исчезает) - ОТКЛЮЧЕНО
        // await deleteCardInstance(worker.cardInstanceId);

       // Сохраняем активных рабочих в БД
       await updateActiveWorkersInDB(updatedActiveWorkers);

       // Обновляем game_data с новыми активными рабочими
       await gameState.actions.batchUpdate({ activeWorkers: updatedActiveWorkers });
       
       console.log('✅ Worker assigned and card instance deleted:', newActiveWorker);
       
        toast({
          title: t(language, 'shelter.workerAssigned'),
          description: `${worker.name} ${t(language, 'shelter.workerAssignedDesc')} "${buildings.find(b => b.id === selectedBuilding)?.name}"`,
        });
      } catch (error) {
       console.error('❌ Failed to save worker assignment:', error);
       // Откатываем изменения при ошибке
       setActiveWorkers(activeWorkers);
       toast({
         title: t(language, 'shelter.error'),
         description: t(language, 'shelter.failedToAssign'),
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
            {t(language, 'shelter.workersInfo')}
          </CardTitle>
          <CardDescription>
            {t(language, 'shelter.hireWorkers')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">
                {t(language, 'shelter.totalSpeedBoost')}: +{totalSpeedBoost}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                {t(language, 'shelter.activeWorkers')}: {activeWorkers.length}
              </span>
            </div>
          </div>
          
          {totalSpeedBoost > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                {t(language, 'shelter.workersBoostActive')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Назначение новых рабочих */}
      <Card>
        <CardHeader>
          <CardTitle>{t(language, 'shelter.assignWorker')}</CardTitle>
          <CardDescription>
            {t(language, 'shelter.assignWorkerDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Выбор здания */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t(language, 'shelter.building')}</label>
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
              <label className="text-sm font-medium mb-2 block">{t(language, 'shelter.availableWorkers')}</label>
              {availableWorkers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t(language, 'shelter.noWorkersInInventory')}</p>
                  <p className="text-sm">{t(language, 'shelter.buyWorkersInShop')}</p>
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
                        {t(language, 'shelter.assignButton')}
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
                  <strong>{t(language, 'shelter.warningTitle')}</strong> {t(language, 'shelter.warningText')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Активные рабочие */}
      {activeWorkers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t(language, 'shelter.activeWorkers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeWorkers.map(worker => (
                <div key={worker.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{worker.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {buildings.find(b => b.id === worker.building)?.name} • +{worker.speedBoost}% {t(language, 'shelter.speedBoost')}
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
    </div>
  );
};