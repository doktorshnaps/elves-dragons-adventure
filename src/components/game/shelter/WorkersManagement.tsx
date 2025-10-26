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

import { Users, Clock, Zap, AlertTriangle } from "lucide-react";
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

  // Получаем рабочих из card_instances, инвентаря и карт
  const inventoryWorkers = (gameState.inventory || [])
    .filter((item: any) => item?.type === 'worker')
    .map((item: any, index: number) => ({
      id: item.instanceId || item.id || `worker_${index}_${item.name}`,
      instanceId: item.instanceId || item.id,
      templateId: item.templateId || undefined,
      name: item.name || 'Рабочий',
      description: item.description || '',
      type: item.type || 'worker',
      value: item.value || 0,
      stats: item.stats || {},
      image: item.image,
      source: 'inventory'
    }));

  const cardInstanceWorkers = cardInstances
    .filter(instance => 
      instance.card_type === 'workers' ||
      ((instance.card_data as any)?.type === 'worker' || (instance.card_data as any)?.type === 'workers')
    )
    .map(instance => ({
      id: instance.id, // уникальный id экземпляра
      instanceId: instance.id,
      templateId: instance.card_template_id,
      name: instance.card_data.name || 'Рабочий',
      description: instance.card_data.description || '',
      type: 'worker',
      value: (instance.card_data as any).value || 0,
      stats: (instance.card_data as any).stats || {},
      image: (instance.card_data as any).image,
      source: 'card_instances',
      currentHealth: instance.current_health,
      maxHealth: instance.max_health
    }));

  const cardsWorkers = (gameState.cards || [])
    .filter((card: any) => card?.type === 'worker' || card?.type === 'workers')
    .map((card: any, index: number) => ({
      id: card.id,
      templateId: card.id,
      name: card.name || 'Рабочий',
      description: card.description || '',
      type: 'worker',
      value: card.value || 0,
      stats: card.stats || {},
      image: card.image,
      source: 'cards',
      _idx: index
    }));

  // Объединяем рабочих из всех источников, избегая дублирования только по instanceId
  const seen = new Set<string>();
  const availableWorkers = [...cardInstanceWorkers, ...inventoryWorkers, ...cardsWorkers]
    .filter((worker: any) => {
      if (worker.instanceId) {
        if (seen.has(worker.instanceId)) return false;
        seen.add(worker.instanceId);
      }
      return true;
    });

  // Исключаем уже назначенных активных рабочих из списка доступных
  const activeInstanceIds = new Set(activeWorkers.map(w => w.cardInstanceId));
  const activeWorkerIds = new Set(activeWorkers.map(w => w.workerId));
  const visibleWorkers = availableWorkers.filter((w: any) =>
    w.instanceId ? !activeInstanceIds.has(w.instanceId) : !activeWorkerIds.has(w.id)
  );

  console.log('👷 Workers analysis:', {
    inventoryWorkers: inventoryWorkers.length,
    cardInstanceWorkers: cardInstanceWorkers.length,
    availableWorkers: availableWorkers.length,
    activeWorkers: activeWorkers.length,
    visibleWorkers: visibleWorkers.length,
    inventoryDetails: inventoryWorkers.map(w => ({ id: w.id, instanceId: w.instanceId, name: w.name, source: w.source })),
    cardDetails: cardInstanceWorkers.map(w => ({ id: w.id, name: w.name, source: w.source, instanceId: (w as any).instanceId })),
    activeWorkersDetails: activeWorkers.map(w => ({ workerId: w.workerId, cardInstanceId: w.cardInstanceId, name: w.name })),
    activeInstanceIdsSet: Array.from(activeInstanceIds),
    activeWorkerIdsSet: Array.from(activeWorkerIds)
  });

  // Загружаем активных рабочих только ОДИН РАЗ при монтировании из БД
  useEffect(() => {
    console.log('🔄 WorkersManagement mounted, loading active workers from DB:', {
      gameStateActiveWorkers: gameState.activeWorkers?.length ?? 0,
      isArray: Array.isArray(gameState.activeWorkers)
    });

    // Загружаем из БД только при первой загрузке
    if (Array.isArray(gameState.activeWorkers) && gameState.activeWorkers.length > 0) {
      console.log('📦 Initial load from DB:', gameState.activeWorkers.length);
      setActiveWorkers(gameState.activeWorkers);
      // Синхронизируем localStorage с БД
      try {
        localStorage.setItem('activeWorkers', JSON.stringify(gameState.activeWorkers));
      } catch (e) {
        console.warn('Failed to save active workers to localStorage:', e);
      }
    }
  }, []); // Пустой массив зависимостей - загружаем только один раз

  // Автоматическая очистка зависших рабочих из инвентаря
  useEffect(() => {
    if (!gameState.actions || activeWorkers.length === 0) return;
    
    const cleanupStuckWorkers = async () => {
      const activeInstanceIds = new Set(activeWorkers.map(w => w.cardInstanceId));
      const activeWorkerIds = new Set(activeWorkers.map(w => w.workerId));
      
      const currentInv = [...(gameState.inventory || [])] as any[];
      const workersInInv = currentInv.filter((item: any) => item?.type === 'worker');
      
      // Находим рабочих, которые уже назначены, но всё ещё в инвентаре
      const stuckWorkers = workersInInv.filter((item: any) => {
        const itemInstanceId = item.instanceId || item.id;
        return activeInstanceIds.has(itemInstanceId) || activeWorkerIds.has(itemInstanceId);
      });
      
      if (stuckWorkers.length > 0) {
        console.log('🧹 Found stuck workers in inventory:', stuckWorkers.length, stuckWorkers.map(w => ({ id: w.id, instanceId: w.instanceId, name: w.name })));
        
        // Удаляем зависших рабочих
        const cleanedInv = currentInv.filter((item: any) => {
          if (item?.type !== 'worker') return true;
          const itemInstanceId = item.instanceId || item.id;
          return !activeInstanceIds.has(itemInstanceId) && !activeWorkerIds.has(itemInstanceId);
        });
        
        await gameState.actions.updateInventory(cleanedInv);
        console.log('✅ Cleaned up stuck workers from inventory. Removed:', stuckWorkers.length);
      }
    };
    
    cleanupStuckWorkers();
  }, [activeWorkers, gameState.inventory, gameState.actions]);

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
           try {
             localStorage.setItem('activeWorkers', JSON.stringify(stillWorking));
           } catch {}
           window.dispatchEvent(new CustomEvent('activeWorkers:changed', { detail: stillWorking }));
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
      cardInstanceId: (worker as any).instanceId || worker.id,
      name: worker.name,
      speedBoost: worker.value,
      startTime: Date.now(),
      duration: worker.stats.workDuration,
      building: selectedBuilding
    };

    const updatedActiveWorkers = [...activeWorkers, newActiveWorker];

    try {
      console.log('🔍 Assigning worker:', {
        workerId: worker.id,
        workerName: worker.name,
        workerSource: worker.source,
        instanceId: (worker as any).instanceId,
        templateId: (worker as any).templateId
      });
      
      // Обновляем локальное состояние
      setActiveWorkers(updatedActiveWorkers);

      // Удаляем рабочего из card_instances, если он оттуда
      if (worker.source === 'card_instances' && (worker as any).instanceId) {
        console.log('🗑️ Deleting worker from card_instances:', (worker as any).instanceId, 'wallet:', accountId);
        if (!accountId) {
          console.warn('⚠️ No wallet connected: cannot delete card instance');
        } else {
          const { data: deleted, error } = await supabase.rpc('remove_card_instance_exact', {
            p_wallet_address: accountId,
            p_instance_id: (worker as any).instanceId
          });
          
          if (error || !deleted) {
            console.error('❌ Failed to delete worker from card_instances:', error);
            throw new Error(`Failed to delete worker: ${error?.message || 'Unknown error'}`);
          }
          
          await loadCardInstances();
          console.log('✅ Worker deleted from card_instances:', (worker as any).instanceId);
        }
      }

      // Сохраняем активных рабочих через RPC
      await updateActiveWorkersInDB(updatedActiveWorkers);
      try {
        localStorage.setItem('activeWorkers', JSON.stringify(updatedActiveWorkers));
      } catch {}
      window.dispatchEvent(new CustomEvent('activeWorkers:changed', { detail: updatedActiveWorkers }));
      
      console.log('✅ Worker assigned and saved:', newActiveWorker);
      
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
                        onClick={() => assignWorker(worker)}
                        size="sm"
                        className="shrink-0"
                        disabled={(worker as any).source === 'card_instances' && (worker as any).currentHealth <= 0}
                      >
                        {t(language, 'shelter.assignButton')}
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