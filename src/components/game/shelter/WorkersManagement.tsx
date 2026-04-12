import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUnifiedGameState } from "@/hooks/useUnifiedGameState";
import { useCardInstances } from "@/hooks/useCardInstances";
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  
  const { toast } = useToast();
  const [activeWorkers, setActiveWorkers] = useState<ActiveWorker[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("main_hall");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  
  // Стабильная ссылка на accountId для useCallback
  const accountIdRef = useRef(accountId);
  accountIdRef.current = accountId;

  // КРИТИЧНО: Мемоизируем функцию чтобы избежать пересоздания интервала
  const updateActiveWorkersInDB = useCallback(async (workers: ActiveWorker[]) => {
    const walletAddress = accountIdRef.current;
    
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
  }, []);
  
  // КРИТИЧНО: Мемоизируем buildings чтобы избежать пересоздания
  const buildings = useMemo(() => [
    { id: "main_hall", name: t(language, 'shelter.mainHall') },
    { id: "workshop", name: t(language, 'shelter.workshop') },
    { id: "storage", name: t(language, 'shelter.storage') },
    { id: "sawmill", name: t(language, 'shelter.sawmill') },
    { id: "quarry", name: t(language, 'shelter.quarry') },
    { id: "barracks", name: t(language, 'shelter.barracksBuilding') },
    { id: "dragon_lair", name: t(language, 'shelter.dragonLairBuilding') },
    { id: "medical", name: t(language, 'shelter.medicalBuilding') },
    { id: "forge", name: t(language, 'shelter.forgeBuilding') }
  ], [language]);

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
    .filter(w => !activeWorkers.find(aw => aw.cardInstanceId === w.id))
    .map(instance => ({
      id: instance.id,
      instanceId: instance.id,
      name: instance.card_data?.name || 'Unknown Worker',
      speedBoost: (instance.card_data as any)?.stats?.speedBoost || (instance.card_data as any)?.stats?.workDuration || 10,
      template_id: instance.card_template_id,
      card_data: instance.card_data,
      description: instance.card_data?.description || '',
      value: (instance.card_data as any)?.value || 0,
      stats: (instance.card_data as any)?.stats || {}
    }));

  console.log('👷 Workers from card_instances:', {
    totalWorkers: cardInstances.filter(i => 
      i.card_type === 'workers' || 
      ((i.card_data as any)?.type === 'worker' || (i.card_data as any)?.type === 'workers')
    ).length,
    activeWorkers: activeWorkers.length,
    visibleWorkers: availableWorkers.length,
    workerDetails: cardInstances
      .filter(i => i.card_type === 'workers' || ((i.card_data as any)?.type === 'worker'))
      .map(i => ({
        id: i.id,
        card_type: i.card_type,
        card_data_type: (i.card_data as any)?.type,
        name: i.card_data?.name,
        template_id: i.card_template_id
      }))
  });

  // visibleWorkers - это просто availableWorkers, так как фильтрация уже выполнена
  const visibleWorkers = availableWorkers;

  // Загружаем активных рабочих только ОДИН РАЗ при монтировании из БД
  useEffect(() => {
    console.log('🔄 WorkersManagement mounted, loading active workers from DB:', {
      gameStateActiveWorkers: gameState.activeWorkers?.length ?? 0,
      isArray: Array.isArray(gameState.activeWorkers)
    });

    // КРИТИЧНО: Инвалидируем кеш card instances при монтировании
    // чтобы получить свежие данные, особенно если админ выдал рабочих
    console.log('🔄 Invalidating cardInstances cache to get fresh data');
    queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });

    // Загружаем из БД только при первой загрузке
    if (Array.isArray(gameState.activeWorkers) && gameState.activeWorkers.length > 0) {
      // ВАЖНО: Фильтруем завершенных рабочих при загрузке и нормализуем статус
      const now = Date.now();
      const validWorkers = gameState.activeWorkers
        .map((worker: any) => {
          // Нормализуем статус, если он пришел как объект
          let normalizedStatus: 'working' | 'waiting' = 'working';
          if (typeof worker.status === 'string') {
            normalizedStatus = worker.status as 'working' | 'waiting';
          } else if (worker.status && typeof worker.status === 'object') {
            normalizedStatus = (worker.status.value || 'working') as 'working' | 'waiting';
          }
          
          return {
            ...worker,
            status: normalizedStatus
          } as ActiveWorker;
        })
        .filter((worker: ActiveWorker) => {
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
      // OPTIMIZATION: Убрали localStorage.setItem - данные только в БД и React Query
      
      
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

  // Стабильные ссылки для использования в интервале
  const toastRef = useRef(toast);
  const buildingsRef = useRef(buildings);
  toastRef.current = toast;
  buildingsRef.current = buildings;

  // Проверяем завершенных рабочих и обновляем статусы каждую секунду
  useEffect(() => {
    console.log('⏱️ Worker check interval started');
    
    const interval = setInterval(() => {
      const now = Date.now();
      
      setActiveWorkers(prev => {
        // Нормализуем статус всех рабочих перед проверкой
        let updated = prev.map(worker => {
          let normalizedStatus: 'working' | 'waiting' = 'working';
          if (typeof worker.status === 'string') {
            normalizedStatus = worker.status as 'working' | 'waiting';
          } else if (worker.status && typeof worker.status === 'object') {
            normalizedStatus = ((worker.status as any).value || 'working') as 'working' | 'waiting';
          }
          return {
            ...worker,
            status: normalizedStatus
          };
        });
        
        let hasChanges = false;
        
        // Находим всех завершенных рабочих
        const finishedWorkers = updated.filter(worker => {
          if (worker.status !== 'working') return false;
          
          const endTime = worker.startTime + worker.duration;
          const remainingTime = endTime - now;
          const isFinished = remainingTime <= 0;
          
          if (isFinished) {
            console.log('✅ Worker finished:', {
              name: worker.name,
              status: worker.status,
              endTime: new Date(endTime).toISOString(),
              now: new Date(now).toISOString(),
              remainingTime
            });
          }
          
          return isFinished;
        });
        
        // Удаляем завершенных рабочих
        if (finishedWorkers.length > 0) {
          console.log('🗑️ REMOVING finished workers:', finishedWorkers.map(w => w.name));
          updated = updated.filter(worker => !finishedWorkers.some(fw => fw.id === worker.id));
          hasChanges = true;
          
          // Показываем toast для завершенных рабочих
          finishedWorkers.forEach(worker => {
            toastRef.current({
              title: "Работа завершена",
              description: `${worker.name} завершил работу в здании "${buildingsRef.current.find(b => b.id === worker.building)?.name}" и исчез`,
            });
          });
        }
        
        // Активируем ожидающих рабочих (только если нет активных в том же здании)
        // IMPORTANT: используем for-цикл вместо .map(), чтобы активация одного рабочего
        // была видна при проверке следующих (иначе все стартуют одновременно)
        for (let i = 0; i < updated.length; i++) {
          const worker = updated[i];
          if (worker.status === 'waiting' && now >= worker.startTime) {
            // Проверяем, нет ли уже работающих рабочих в этом здании
            const hasActiveWorkerInBuilding = updated.some(
              (w, idx) => idx !== i &&
                   w.building === worker.building && 
                   w.status === 'working' && 
                   (w.startTime + w.duration) > now
            );
            
            if (!hasActiveWorkerInBuilding) {
              console.log('▶️ Starting queued worker:', {
                name: worker.name,
                building: worker.building,
                scheduledStart: new Date(worker.startTime)
              });
              hasChanges = true;
              updated[i] = { ...worker, status: 'working' as const };
            } else {
              console.log('⏸️ Worker still waiting (another active in building):', {
                name: worker.name,
                building: worker.building
              });
            }
          }
        }
        
        // Сохраняем изменения
        if (hasChanges || updated.length !== prev.length) {
          console.log('💾 SAVING changes:', {
            before: prev.length,
            after: updated.length,
            removed: prev.length - updated.length
          });
          
          updateActiveWorkersInDB(updated);
          // OPTIMIZATION: Убрали localStorage - данные только в БД
          // Invalidate workers cache instead of window event
          queryClient.invalidateQueries({ queryKey: ['gameData'] });
        }
        
        return updated;
      });
    }, 1000);

    return () => {
      console.log('⏱️ Worker check interval stopped');
      clearInterval(interval);
    };
  }, [updateActiveWorkersInDB]); // Убрали toast и buildings из зависимостей

  const assignWorker = async (worker: any) => {
    const workerId = (worker as any).instanceId || worker.id;
    console.log('🎯 assignWorker START:', { workerId, name: worker.name, source: worker.source });

    // Защита от двойного клика
    if (assigningId === workerId) {
      console.log('⚠️ Already assigning this worker, skipping');
      return;
    }

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

    // Находим рабочих в этом же здании (включая ожидающих)
    const workersInSameBuilding = activeWorkers.filter(w => w.building === selectedBuilding);
    
    let startTime = Date.now();
    let status: 'working' | 'waiting' = 'working';
    
    // Если есть рабочие в здании, новый идет в очередь
    if (workersInSameBuilding.length > 0) {
      // Находим максимальное время окончания среди всех рабочих в здании
      const lastWorkerEndTime = Math.max(
        ...workersInSameBuilding.map(w => w.startTime + w.duration)
      );
      
      // Новый рабочий начнет работу ПОСЛЕ завершения последнего
      startTime = Math.max(lastWorkerEndTime, Date.now());
      status = 'waiting';
      
      console.log('📋 Worker queued in building:', {
        building: selectedBuilding,
        existingWorkers: workersInSameBuilding.length,
        lastEndTime: new Date(lastWorkerEndTime),
        newStartTime: new Date(startTime),
        queueDelay: Math.round((startTime - Date.now()) / 1000) + 's'
      });
    } else {
      console.log('✨ First worker in building, starting immediately:', selectedBuilding);
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
      // Атомарно назначаем рабочего (удаление из card_instances + добавление в active_workers)
      if ((worker as any).instanceId) {
        const instId = (worker as any).instanceId as string;
        console.log('🎯 Assigning worker atomically:', instId);
        
        const { data, error } = await supabase.rpc('assign_worker_to_building', {
          p_wallet_address: accountId,
          p_card_instance_id: instId,
          p_active_worker: newActiveWorker as any
        });
        
        if (error) throw error;
        console.log('✅ Worker assigned atomically:', data);
        
        // Используем данные из RPC ответа для обновления состояния
        if (data && typeof data === 'object' && 'active_workers' in data) {
          const workers = (data as any).active_workers as ActiveWorker[];
          setActiveWorkers(workers);
          // OPTIMIZATION: Убрали localStorage - данные только в БД
        }
        
        // Инвалидируем кеш card_instances для обновления списка
        queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {buildings.map(building => {
                  const stats = getBuildingStats(building.id);
                  const hasWorkers = stats.workingCount > 0 || stats.waitingCount > 0;
                  
                  return (
                    <Button
                      key={building.id}
                      variant={selectedBuilding === building.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedBuilding(building.id)}
                      className="justify-between h-auto py-2 min-w-0"
                    >
                      <span className="truncate flex-1 text-left">{building.name}</span>
                      {hasWorkers && (
                        <div className="flex flex-col items-end text-xs ml-2 flex-shrink-0">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {stats.workingCount}
                            {stats.waitingCount > 0 && (
                              <span className="text-muted-foreground">+{stats.waitingCount}</span>
                            )}
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap">
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">{t(language, 'shelter.availableWorkers')}</label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    console.log('🔄 Manual refresh of card instances requested');
                    await loadCardInstances();
                    toast({
                      title: "Обновлено",
                      description: "Список рабочих обновлен"
                    });
                  }}
                  className="h-7 px-2"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Обновить
                </Button>
              </div>
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
                <div key={worker.id} className="p-3 sm:p-4 border rounded-lg overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium truncate">{worker.name}</h4>
                        {worker.status === 'waiting' && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            В очереди
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {buildings.find(b => b.id === worker.building)?.name} • +{worker.speedBoost}% {t(language, 'shelter.speedBoost')}
                      </p>
                    </div>
                    <Badge variant={worker.status === 'working' ? 'secondary' : 'outline'} className="flex-shrink-0 whitespace-nowrap self-start sm:self-center">
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