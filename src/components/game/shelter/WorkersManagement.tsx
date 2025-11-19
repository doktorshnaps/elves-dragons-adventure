import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUnifiedGameState } from "@/hooks/useUnifiedGameState";
import { useCardInstances } from "@/hooks/useCardInstances";

import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

import { Users, Clock, Zap, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface ActiveWorker {
  id: string;
  workerId: string;
  cardInstanceId: string;
  name: string;
  speedBoost: number;
  startTime: number;
  duration: number;
  building: string;
  status: 'working' | 'waiting';
}

interface WorkersManagementProps {
  onSpeedBoostChange?: (totalBoost: number) => void;
}

export const WorkersManagement = ({ onSpeedBoostChange }: WorkersManagementProps) => {
  const gameState = useUnifiedGameState();
  const { cardInstances, deleteCardInstance, loadCardInstances } = useCardInstances();
  const { language } = useLanguage();
  const { accountId } = useWalletContext();
  
  const { toast } = useToast();
  const [activeWorkers, setActiveWorkers] = useState<ActiveWorker[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("main_hall");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const updateActiveWorkersInDB = async (workers: ActiveWorker[]) => {
    // Получаем wallet из контекста кошелька
    const walletAddress = accountId;
    
    if (!walletAddress) {
      console.warn('⚠️ No wallet connected: skip DB update for active workers');
      return;
    }

    console.log('🔄 Updating active workers in DB:', {
      walletAddress,
      workersCount: workers.length,
      workers: workers.map(w => ({ id: w.id, name: w.name, building: w.building }))
    });

    try {
      const { error } = await supabase.rpc('update_active_workers_by_wallet', { 
        p_wallet_address: walletAddress,
        p_active_workers: workers as any 
      });
      
      if (error) {
        console.error('❌ Failed to update active workers in DB:', error);
      } else {
        console.log('✅ Active workers updated in DB successfully:', workers.length);
      }
    } catch (error) {
      console.error('❌ Error updating active workers in DB:', error);
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

  // Получаем статистику по зданию
  const getBuildingStats = (buildingId: string) => {
    const workers = activeWorkers.filter(w => w.building === buildingId);
    const workingCount = workers.filter(w => w.status === 'working').length;
    const waitingCount = workers.filter(w => w.status === 'waiting').length;
    const totalTime = workers.reduce((sum, w) => sum + w.duration, 0);
    return { workingCount, waitingCount, totalTime };
  };

  // Получаем рабочих только из card_instances (единственный источник для workers)
  const availableWorkers = cardInstances
    .filter(instance => 
      instance.card_type === 'workers' ||
      ((instance.card_data as any)?.type === 'worker' || (instance.card_data as any)?.type === 'workers')
    )
    .map(instance => ({
      id: instance.id,
      instanceId: instance.id,
      templateId: instance.card_template_id,
      name: instance.card_data.name || 'Рабочий',
      description: instance.card_data.description || '',
      type: 'worker',
      value: (instance.card_data as any).value || 0,
      stats: (instance.card_data as any).stats || {},
      image: (instance.card_data as any).image,
      currentHealth: instance.current_health,
      maxHealth: instance.max_health
    }));

  // Исключаем уже назначенных активных рабочих из списка доступных
  const activeInstanceIds = new Set(activeWorkers.map(w => w.cardInstanceId));
  const activeWorkerIds = new Set(activeWorkers.map(w => w.workerId));
  const visibleWorkers = availableWorkers.filter((w: any) =>
    w.instanceId ? !activeInstanceIds.has(w.instanceId) : !activeWorkerIds.has(w.id)
  );

  console.log('👷 Workers from card_instances:', {
    totalWorkers: availableWorkers.length,
    activeWorkers: activeWorkers.length,
    visibleWorkers: visibleWorkers.length,
    workerDetails: availableWorkers.map(w => ({ id: w.id, name: w.name, stats: w.stats }))
  });

  // Загружаем активных рабочих только ОДИН РАЗ при монтировании из БД
  useEffect(() => {
    console.log('🔄 WorkersManagement mounted, loading active workers from DB:', {
      gameStateActiveWorkers: gameState.activeWorkers?.length ?? 0,
      isArray: Array.isArray(gameState.activeWorkers)
    });

    // Загружаем из БД только при первой загрузке
    if (Array.isArray(gameState.activeWorkers) && gameState.activeWorkers.length > 0) {
      // ВАЖНО: Фильтруем завершенных рабочих при загрузке
      const now = Date.now();
      const validWorkers = gameState.activeWorkers.filter((worker: ActiveWorker) => {
        const isFinished = worker.status === 'working' && now >= (worker.startTime + worker.duration);
        if (isFinished) {
          console.log('🚫 Skipping finished worker from DB:', worker.name);
        }
        return !isFinished;
      });
      
      console.log('📦 Initial load from DB:', {
        total: gameState.activeWorkers.length,
        valid: validWorkers.length,
        removed: gameState.activeWorkers.length - validWorkers.length
      });
      
      setActiveWorkers(validWorkers);
      // Синхронизируем localStorage с отфильтрованными данными
      try {
        localStorage.setItem('activeWorkers', JSON.stringify(validWorkers));
      } catch (e) {
        console.warn('Failed to save active workers to localStorage:', e);
      }
      
      // Если были удалены завершенные рабочие, обновляем БД
      if (validWorkers.length < gameState.activeWorkers.length) {
        updateActiveWorkersInDB(validWorkers);
      }
    }
  }, []); // Пустой массив зависимостей - загружаем только один раз

  // Вычисляем общее ускорение при изменении активных рабочих
  useEffect(() => {
    const totalBoost = activeWorkers.reduce((sum, worker) => sum + worker.speedBoost, 0);
    onSpeedBoostChange?.(totalBoost);
  }, [activeWorkers, onSpeedBoostChange]);

  // Проверяем завершенных рабочих и обновляем статусы каждую секунду
  useEffect(() => {
    console.log('⏱️ Worker check interval started');
    
    const interval = setInterval(() => {
      const now = Date.now();
      
      setActiveWorkers(prev => {
        // Детальное логирование для каждого рабочего
        console.log('🔍 Checking workers:', {
          totalWorkers: prev.length,
          now,
          workers: prev.map(w => {
            const remaining = (w.startTime + w.duration) - now;
            return {
              name: w.name,
              status: w.status,
              startTime: w.startTime,
              duration: w.duration,
              remaining,
              shouldRemove: w.status === 'working' && remaining <= 0
            };
          })
        });
        
        let updated = [...prev];
        let hasChanges = false;
        
        // Находим всех завершенных рабочих
        const finishedWorkers = updated.filter(worker => {
          if (worker.status !== 'working') return false;
          
          const endTime = worker.startTime + worker.duration;
          const remainingTime = endTime - now;
          const isFinished = remainingTime <= 0;
          
          console.log('🎯 Checking worker:', {
            name: worker.name,
            status: worker.status,
            endTime,
            now,
            remainingTime,
            isFinished
          });
          
          return isFinished;
        });
        
        // Удаляем завершенных рабочих
        if (finishedWorkers.length > 0) {
          console.log('🗑️ REMOVING finished workers:', finishedWorkers.map(w => w.name));
          updated = updated.filter(worker => !finishedWorkers.some(fw => fw.id === worker.id));
          hasChanges = true;
          
          // Показываем toast для завершенных рабочих
          finishedWorkers.forEach(worker => {
            toast({
              title: "Работа завершена",
              description: `${worker.name} завершил работу в здании "${buildings.find(b => b.id === worker.building)?.name}" и исчез`,
            });
          });
        }
        
        // Активируем ожидающих рабочих
        updated = updated.map(worker => {
          if (worker.status === 'waiting' && now >= worker.startTime) {
            console.log('▶️ Starting queued worker:', worker.name);
            hasChanges = true;
            return { ...worker, status: 'working' as const };
          }
          return worker;
        });
        
        // Сохраняем изменения
        if (hasChanges || updated.length !== prev.length) {
          console.log('💾 SAVING changes:', {
            before: prev.length,
            after: updated.length,
            removed: prev.length - updated.length
          });
          
          updateActiveWorkersInDB(updated);
          try {
            localStorage.setItem('activeWorkers', JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to save to localStorage:', e);
          }
          window.dispatchEvent(new CustomEvent('activeWorkers:changed', { detail: updated }));
        }
        
        return updated;
      });
    }, 1000);

    return () => {
      console.log('⏱️ Worker check interval stopped');
      clearInterval(interval);
    };
  }, [toast, buildings, updateActiveWorkersInDB]);

  const assignWorker = async (worker: any) => {
    const workerId = (worker as any).instanceId || worker.id;
    console.log('🎯 assignWorker START:', { workerId, name: worker.name, source: worker.source });

    if (!worker.stats?.workDuration) {
      console.error('❌ No workDuration!');
      toast({
        title: t(language, 'shelter.error'),
        description: 'Рабочий не имеет длительности работы',
        variant: "destructive"
      });
      return;
    }

    setAssigningId(workerId);
    console.log('⏳ Setting assigningId:', workerId);

    // Находим рабочих в этом же здании
    const workersInSameBuilding = activeWorkers.filter(w => w.building === selectedBuilding);
    
    let startTime = Date.now();
    let status: 'working' | 'waiting' = 'working';
    
    // Если есть рабочие в здании, новый идет в очередь
    if (workersInSameBuilding.length > 0) {
      // Находим время окончания последнего рабочего в очереди
      const lastWorkerEndTime = Math.max(
        ...workersInSameBuilding.map(w => w.startTime + w.duration)
      );
      startTime = lastWorkerEndTime;
      status = 'waiting';
      console.log('📋 Worker queued after existing workers, will start at:', new Date(startTime));
    }

    const newActiveWorker: ActiveWorker = {
      id: `${worker.id}_${Date.now()}`,
      workerId: worker.id,
      cardInstanceId: workerId,
      name: worker.name,
      speedBoost: worker.value,
      startTime,
      duration: worker.stats.workDuration,
      building: selectedBuilding,
      status
    };

    try {
      // Сразу обновляем UI оптимистично
      const updatedActiveWorkers = [...activeWorkers, newActiveWorker];
      setActiveWorkers(updatedActiveWorkers);
      console.log('✅ Optimistic UI update done');

      // Удаляем рабочего из card_instances
      if ((worker as any).instanceId) {
        const instId = (worker as any).instanceId as string;
        console.log('🗑️ Deleting worker from card_instances:', instId);
        
        try {
          const { error } = await supabase.rpc('remove_card_instance_exact', {
            p_instance_id: instId,
            p_wallet_address: accountId
          });
          
          if (error) throw error;
          console.log('✅ Worker deleted from card_instances');
          await loadCardInstances();
        } catch (e) {
          console.error('❌ Failed to delete worker:', e);
          setAssigningId(null);
          setActiveWorkers(activeWorkers);
          toast({
            title: t(language, 'shelter.error'),
            description: 'Не удалось удалить рабочего',
            variant: 'destructive'
          });
          return;
        }
      }

      // Сохраняем в БД с таймаутом
      console.log('💾 Saving to DB...');
      try {
        await Promise.race([
          updateActiveWorkersInDB(updatedActiveWorkers),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 5000))
        ]);
        console.log('✅ Saved to DB');
      } catch (e) {
        console.warn('⚠️ DB save timeout, continuing anyway:', e);
      }

      // Сохраняем локально
      try {
        localStorage.setItem('activeWorkers', JSON.stringify(updatedActiveWorkers));
        window.dispatchEvent(new CustomEvent('activeWorkers:changed', { detail: updatedActiveWorkers }));
      } catch (e) {
        console.warn('⚠️ localStorage save failed:', e);
      }
      
      setAssigningId(null);
      console.log('✅ Worker assigned successfully:', newActiveWorker.name);
      
      toast({
        title: t(language, 'shelter.workerAssigned'),
        description: `${worker.name} назначен в "${buildings.find(b => b.id === selectedBuilding)?.name}"`,
      });
    } catch (error) {
      console.error('❌ Assignment failed:', error);
      setAssigningId(null);
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

  // Учитываем только работающих рабочих для ускорения
  const totalSpeedBoost = activeWorkers
    .filter(w => w.status === 'working')
    .reduce((sum, worker) => sum + worker.speedBoost, 0);

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
                {buildings.map(building => {
                  const stats = getBuildingStats(building.id);
                  const hasWorkers = stats.workingCount > 0 || stats.waitingCount > 0;
                  
                  return (
                    <Button
                      key={building.id}
                      variant={selectedBuilding === building.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedBuilding(building.id)}
                      className="justify-between h-auto py-2"
                    >
                      <span>{building.name}</span>
                      {hasWorkers && (
                        <div className="flex flex-col items-end text-xs ml-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {stats.workingCount}
                            {stats.waitingCount > 0 && (
                              <span className="text-muted-foreground">+{stats.waitingCount}</span>
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            {formatTime(stats.totalTime)}
                          </span>
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Доступные рабочие */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t(language, 'shelter.availableWorkers')}</label>
              {visibleWorkers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t(language, 'shelter.noWorkersInInventory')}</p>
                  <p className="text-sm">{t(language, 'shelter.buyWorkersInShop')}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {visibleWorkers.map((worker, i) => (
                    <div key={(worker as any).instanceId || `${worker.id}-${(worker as any)._idx ?? i}` } className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{worker.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          +{worker.value}% ускорение • {formatTime(worker.stats?.workDuration || 0)}
                          {(worker as any).source === 'card_instances' && (worker as any).currentHealth < (worker as any).maxHealth && (
                            <span className="text-amber-600 ml-2">
                              ❤️ {(worker as any).currentHealth}/{(worker as any).maxHealth}
                            </span>
                          )}
                        </p>
                        {worker.description && (
                          <p className="text-xs text-muted-foreground mt-1">{worker.description}</p>
                        )}
                      </div>
                      <Button 
                        type="button"
                        onMouseDown={(e) => {
                          console.log('🖱️ MOUSEDOWN on assign for worker:', worker.id, worker.name);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ BUTTON CLICKED for worker:', worker.id, worker.name);
                          assignWorker(worker);
                        }}
                        size="sm"
                        className="shrink-0 pointer-events-auto"
                        disabled={assigningId === ((worker as any).instanceId || worker.id) || ((worker as any).source === 'card_instances' && (worker as any).currentHealth <= 0)}
                      >
                        {assigningId === ((worker as any).instanceId || worker.id) ? (
                          <span className="inline-flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t(language, 'shelter.assignButton')}
                          </span>
                        ) : (
                          t(language, 'shelter.assignButton')
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {visibleWorkers.length > 0 && (
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{worker.name}</h4>
                        {worker.status === 'waiting' && (
                          <Badge variant="outline" className="text-xs">
                            В очереди
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {buildings.find(b => b.id === worker.building)?.name} • +{worker.speedBoost}% {t(language, 'shelter.speedBoost')}
                      </p>
                    </div>
                    <Badge variant={worker.status === 'working' ? 'secondary' : 'outline'}>
                      {worker.status === 'waiting' ? 'Ожидает' : formatTime(getRemainingTime(worker))}
                    </Badge>
                  </div>
                  {worker.status === 'working' && (
                    <Progress value={getProgress(worker)} className="w-full" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};