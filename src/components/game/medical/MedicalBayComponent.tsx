import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Heart, Plus, Activity, ArrowRight, X, Skull, Sparkles } from 'lucide-react';
import { useMedicalBay } from '@/hooks/useMedicalBay';
import { useForgeBay } from '@/hooks/useForgeBay';
import { useCardInstancesContext } from '@/providers/CardInstancesProvider';

console.log('🏥 [MedicalBayComponent] Loaded - using centralized CardInstancesContext');
import { useCardsWithHealth } from '@/hooks/useCardsWithHealth';
import { useUnifiedGameState } from '@/hooks/useUnifiedGameState';
import { CardDisplay } from '../CardDisplay';

const RESURRECTION_COST = 100; // Стоимость воскрешения в ELL

export const MedicalBayComponent = () => {
  const {
    medicalBayEntries,
    loading,
    loadMedicalBayEntries,
    placeCardInMedicalBay,
    removeCardFromMedicalBay,
    stopHealingWithoutRecovery,
    processMedicalBayHealing,
    resurrectCard,
    completeResurrection
  } = useMedicalBay();

  // Получаем записи кузницы для проверки занятых карт
  const { forgeBayEntries } = useForgeBay();

  // КРИТИЧНО: Получаем данные ТОЛЬКО из провайдера
  const { cardInstances, loadCardInstances } = useCardInstancesContext();
  
  console.log('🏥 [MedicalBayComponent] CardInstances from context:', {
    total: cardInstances.length,
    heroes: cardInstances.filter(ci => ci.card_type === 'hero').length,
    dragons: cardInstances.filter(ci => ci.card_type === 'dragon').length
  });
  const { cardsWithHealth, selectedTeamWithHealth } = useCardsWithHealth();
  const gameState = useUnifiedGameState();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [selectedDeadCard, setSelectedDeadCard] = useState<any>(null);
  const HEAL_RATE = 100;
  const isStartingRef = useRef(false);

  // Уникальные записи медпункта (без дублей по card_instance_id)
  const uniqueMedicalEntries = useMemo(() => {
    const map = new Map<string, any>();
    for (const e of medicalBayEntries) {
      if (!map.has(e.card_instance_id)) map.set(e.card_instance_id, e);
      else {
        const existing = map.get(e.card_instance_id);
        const existingTime = new Date(existing.placed_at).getTime();
        const currentTime = new Date(e.placed_at).getTime();
        if (currentTime < existingTime) map.set(e.card_instance_id, e);
      }
    }
    return Array.from(map.values());
  }, [medicalBayEntries]);

  // Разделяем записи на лечение и воскрешение
  const healingEntries = useMemo(() => 
    uniqueMedicalEntries.filter(e => e.heal_rate > 0), [uniqueMedicalEntries]);
  const resurrectionEntries = useMemo(() => 
    uniqueMedicalEntries.filter(e => e.heal_rate === 0), [uniqueMedicalEntries]);

  useEffect(() => {
    loadMedicalBayEntries();
    loadCardInstances();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Автоматическая обработка лечения каждую минуту (только если есть рабочие)
  useEffect(() => {
    const interval = setInterval(() => {
      const hasWorkersInMedical = cardsWithHealth.some(card => 
        (card as any)?.assignedBuilding === 'medical'
      ) || 
      gameState?.activeWorkers?.some((worker: any) => worker.building === 'medical') || false;
      
      if (hasWorkersInMedical && medicalBayEntries.length > 0) {
        console.log('🏥 Processing automatic healing...');
        processMedicalBayHealing();
      } else if (!hasWorkersInMedical) {
        console.log('🏥 Medical bay inactive - no workers assigned');
      }
    }, 60000); // каждую минуту

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Получаем раненые карты (здоровье > 0, но < max)
  const getInjuredCards = () => {
    console.log('🏥 Getting injured cards...');
    
    const cardsInMedicalBay = Array.from(new Set(medicalBayEntries.map(entry => entry.card_instance_id)));
    
    const uniqueCardsMap = new Map();
    
    cardInstances.forEach(instance => {
      if (instance.card_type === 'hero' || instance.card_type === 'dragon') {
        const instanceId = instance.id;
        if (!uniqueCardsMap.has(instanceId)) {
          const cardData = instance.card_data as any;
          const card = {
            id: instance.id,
            instanceId: instance.id,
            name: cardData.name,
            type: cardData.type,
            faction: cardData.faction,
            rarity: cardData.rarity,
            image: cardData.image,
            power: instance.max_power,
            defense: instance.max_defense,
            health: instance.max_health,
            magic: instance.max_magic,
            currentHealth: instance.current_health,
            currentDefense: instance.current_defense,
            maxDefense: instance.max_defense
          };
          uniqueCardsMap.set(instanceId, { card, instance });
        }
      }
    });
    
    // Фильтруем: здоровье > 0 И здоровье < max (раненые, но не мёртвые)
    const injuredCards = Array.from(uniqueCardsMap.values())
      .filter(({ card, instance }) => {
        const currentHealth = instance?.current_health ?? 0;
        const maxHealth = instance?.max_health ?? 0;
        const isInMedicalBay = instance?.is_in_medical_bay || (card as any).isInMedicalBay;
        const instanceId = instance?.id;
        
        const hasRealInstance = Boolean(instanceId);
        const isInjured = currentHealth > 0 && currentHealth < maxHealth; // > 0 означает НЕ мёртвая
        const notInMedicalBay = !isInMedicalBay && instanceId && !cardsInMedicalBay.includes(instanceId);
        
        return hasRealInstance && isInjured && notInMedicalBay;
      })
      .map(({ card, instance }) => ({
        id: instance!.id,
        card_template_id: card.id,
        current_health: instance.current_health,
        max_health: instance.max_health,
        current_defense: instance.current_defense,
        max_defense: instance.max_defense,
        max_power: instance.max_power,
        max_magic: instance.max_magic,
        card_data: card,
        wallet_address: instance.wallet_address
      }));
    
    console.log('🏥 Found injured cards:', injuredCards.length);
    return injuredCards;
  };

  // Получаем мёртвые карты (здоровье = 0)
  const getDeadCards = () => {
    console.log('🏥 Getting dead cards...');
    
    const cardsInMedicalBay = Array.from(new Set(medicalBayEntries.map(entry => entry.card_instance_id)));
    
    const uniqueCardsMap = new Map();
    
    cardInstances.forEach(instance => {
      if (instance.card_type === 'hero' || instance.card_type === 'dragon') {
        const instanceId = instance.id;
        if (!uniqueCardsMap.has(instanceId)) {
          const cardData = instance.card_data as any;
          const card = {
            id: instance.id,
            instanceId: instance.id,
            name: cardData.name,
            type: cardData.type,
            faction: cardData.faction,
            rarity: cardData.rarity,
            image: cardData.image,
            power: instance.max_power,
            defense: instance.max_defense,
            health: instance.max_health,
            magic: instance.max_magic,
            currentHealth: instance.current_health,
            currentDefense: instance.current_defense,
            maxDefense: instance.max_defense
          };
          uniqueCardsMap.set(instanceId, { card, instance });
        }
      }
    });
    
    // Фильтруем: здоровье = 0 (мёртвые)
    const deadCards = Array.from(uniqueCardsMap.values())
      .filter(({ card, instance }) => {
        const currentHealth = instance?.current_health ?? 0;
        const isInMedicalBay = instance?.is_in_medical_bay || (card as any).isInMedicalBay;
        const instanceId = instance?.id;
        
        const hasRealInstance = Boolean(instanceId);
        const isDead = currentHealth === 0;
        const notInMedicalBay = !isInMedicalBay && instanceId && !cardsInMedicalBay.includes(instanceId);
        
        return hasRealInstance && isDead && notInMedicalBay;
      })
      .map(({ card, instance }) => ({
        id: instance!.id,
        card_template_id: card.id,
        current_health: instance.current_health,
        max_health: instance.max_health,
        current_defense: instance.current_defense,
        max_defense: instance.max_defense,
        max_power: instance.max_power,
        max_magic: instance.max_magic,
        card_data: card,
        wallet_address: instance.wallet_address
      }));
    
    console.log('🏥 Found dead cards:', deadCards.length);
    return deadCards;
  };

  const getAvailableSlots = () => {
    return 3 - medicalBayEntries.length;
  };

  const handleCardSelect = (card: any) => {
    setSelectedCard(selectedCard?.id === card.id ? null : card);
    setSelectedDeadCard(null); // Сбрасываем выбор мёртвой карты
  };

  const handleDeadCardSelect = (card: any) => {
    setSelectedDeadCard(selectedDeadCard?.id === card.id ? null : card);
    setSelectedCard(null); // Сбрасываем выбор раненой карты
  };

  const handleStartHealing = async () => {
    console.log('🏥 [START] handleStartHealing called');
    console.log('🏥 [START] selectedCard:', selectedCard);
    console.log('🏥 [START] gameState.activeWorkers:', gameState?.activeWorkers);
    
    if (!selectedCard) {
      console.log('🏥 [ERROR] No card selected!');
      return;
    }

    if (isStartingRef.current) {
      console.log('🏥 [WARN] Duplicate press detected (local ref), ignoring');
      return;
    }
    isStartingRef.current = true;

    if (loading) {
      console.log('🏥 [WARN] Already processing, ignoring duplicate call');
      isStartingRef.current = false;
      return;
    }
    
    console.log('🏥 Starting healing for card:', selectedCard);
    
    let cardInstanceId = selectedCard.id as string;
    if (String(selectedCard.id).startsWith('virtual-')) {
      console.log('🏥 Creating instance for virtual card:', selectedCard.card_template_id);
      cardInstanceId = selectedCard.card_template_id;
    }
    
    console.log('🏥 Calling placeCardInMedicalBay with ID:', cardInstanceId);

    const cardToHeal = selectedCard;
    
    setSelectedCard(null);

    try {
      await placeCardInMedicalBay(cardInstanceId);
    } catch (error) {
      console.error('🏥 Error starting healing:', error);
      setSelectedCard(cardToHeal);
    } finally {
      isStartingRef.current = false;
    }
  };

  // Начать воскрешение мёртвой карты
  const handleStartResurrection = async () => {
    if (!selectedDeadCard) return;
    
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    if (loading) {
      isStartingRef.current = false;
      return;
    }

    const cardToResurrect = selectedDeadCard;
    setSelectedDeadCard(null);

    try {
      await resurrectCard(cardToResurrect.id);
    } catch (error) {
      console.error('🏥 Error starting resurrection:', error);
      setSelectedDeadCard(cardToResurrect);
    } finally {
      isStartingRef.current = false;
    }
  };

  const getEstimatedTimeRemaining = (estimatedCompletion: string) => {
    const now = new Date();
    const completion = new Date(estimatedCompletion);
    const diff = completion.getTime() - now.getTime();
    
    if (diff <= 0) return "Готово";
    
    const minutes = Math.ceil(diff / (1000 * 60));
    if (minutes < 60) return `${minutes} мин.`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  };

  const getHealingProgress = (placedAt: string, estimatedCompletion: string) => {
    const now = new Date();
    const start = new Date(placedAt);
    const end = new Date(estimatedCompletion);
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const injuredCards = getInjuredCards();
  const deadCards = getDeadCards();
  const canStartHealing = getAvailableSlots() > 0;
  const playerBalance = gameState?.balance ?? 0;
  const canAffordResurrection = playerBalance >= RESURRECTION_COST;

  return (
    <div className="space-y-6">
      {/* Medical Bay Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              <CardTitle className="text-2xl">Медпункт</CardTitle>
            </div>
            <Badge variant="secondary">
              Слотов: {uniqueMedicalEntries.length}/3
            </Badge>
          </div>
          <CardDescription>
            Восстановление здоровья поврежденных карт. Доступных слотов: {getAvailableSlots()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Скорость лечения: {HEAL_RATE} HP/мин</p>
              <p>• Активных лечений: {healingEntries.length}/3</p>
              <p>• Раненых карт: {injuredCards.length}</p>
              <p className="text-purple-400">• Мёртвых карт: {deadCards.length}</p>
              <p className="text-purple-400">• Воскрешений в процессе: {resurrectionEntries.length}</p>
              <p className="text-purple-400">• Стоимость воскрешения: {RESURRECTION_COST} ELL</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Healing Processes */}
      {healingEntries.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Лечение в процессе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healingEntries.map((entry) => {
                const cardData = entry.card_instances?.card_data;
                const progress = getHealingProgress(entry.placed_at, entry.estimated_completion);
                const timeRemaining = getEstimatedTimeRemaining(entry.estimated_completion);
                const isReady = timeRemaining === "Готово";

                return (
                  <div key={entry.id} className="p-4 border border-green-500/20 rounded-lg">
                    <div className="flex items-start gap-4 mb-4">
                      {cardData && (
                        <div className="flex-shrink-0">
                          <div className="text-xs text-muted-foreground mb-1">Лечится:</div>
                          <CardDisplay 
                            card={{
                              ...cardData,
                              health: entry.card_instances?.max_health ?? cardData.health,
                              currentHealth: entry.card_instances?.current_health ?? cardData.currentHealth,
                              currentDefense: entry.card_instances?.current_defense ?? cardData.currentDefense,
                              maxDefense: entry.card_instances?.max_defense ?? cardData.maxDefense,
                              power: entry.card_instances?.max_power ?? cardData.power,
                              defense: entry.card_instances?.max_defense ?? cardData.defense,
                              magic: entry.card_instances?.max_magic ?? cardData.magic
                            }}
                            showSellButton={false}
                            className="w-16 h-24 text-xs"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="font-medium">
                              {cardData?.name || 'Неизвестная карта'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                             {!isReady && (
                               <Button
                                 onClick={async () => {
                                   try {
                                     await stopHealingWithoutRecovery(entry.card_instance_id);
                                   } catch (error) {
                                     console.error('🏥 Error stopping healing:', error);
                                   }
                                 }}
                                 size="sm"
                                 variant="outline"
                                 disabled={loading}
                                 className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                               >
                                 <X className="w-3 h-3 mr-1" />
                                 Остановить
                               </Button>
                             )}
                             {isReady ? (
                               <Button 
                                 onClick={async () => {
                                   try {
                                     await removeCardFromMedicalBay(entry.card_instance_id);
                                   } catch (error) {
                                     console.error('🏥 Error removing card:', error);
                                   }
                                 }}
                                 size="sm"
                                 disabled={loading}
                                 className="bg-green-600 hover:bg-green-700"
                               >
                                 Забрать
                               </Button>
                             ) : (
                               <div className="flex items-center gap-1 text-sm">
                                 <Clock className="w-4 h-4" />
                                 {timeRemaining}
                               </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Статус:</span>
                            <Badge variant={isReady ? "default" : "secondary"}>
                              <Clock className="w-3 h-3 mr-1" />
                              {timeRemaining}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Здоровье:</span>
                            <span className="font-medium">
                              {isReady 
                                ? `${entry.card_instances?.max_health || 0} / ${entry.card_instances?.max_health || 0}`
                                : `${entry.card_instances?.current_health || 0} / ${entry.card_instances?.max_health || 0}`
                              }
                            </span>
                          </div>
                          
                          {!isReady && <Progress value={progress} className="h-2" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Resurrection Processes */}
      {resurrectionEntries.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Воскрешение в процессе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resurrectionEntries.map((entry) => {
                const cardData = entry.card_instances?.card_data;
                const progress = getHealingProgress(entry.placed_at, entry.estimated_completion);
                const timeRemaining = getEstimatedTimeRemaining(entry.estimated_completion);
                const isReady = timeRemaining === "Готово";
                const targetHealth = Math.floor((entry.card_instances?.max_health || 100) / 2);

                return (
                  <div key={entry.id} className="p-4 border border-purple-500/20 rounded-lg">
                    <div className="flex items-start gap-4 mb-4">
                      {cardData && (
                        <div className="flex-shrink-0 relative">
                          <div className="text-xs text-purple-400 mb-1">Воскрешается:</div>
                          <div className="relative">
                            <CardDisplay 
                              card={{
                                ...cardData,
                                health: entry.card_instances?.max_health ?? cardData.health,
                                currentHealth: 0,
                                currentDefense: entry.card_instances?.current_defense ?? 0,
                                maxDefense: entry.card_instances?.max_defense ?? cardData.maxDefense,
                                power: entry.card_instances?.max_power ?? cardData.power,
                                defense: entry.card_instances?.max_defense ?? cardData.defense,
                                magic: entry.card_instances?.max_magic ?? cardData.magic
                              }}
                              showSellButton={false}
                              className="w-16 h-24 text-xs opacity-60"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Skull className="w-6 h-6 text-purple-500 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">
                              {cardData?.name || 'Неизвестная карта'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                             {isReady ? (
                               <Button 
                                 onClick={async () => {
                                   try {
                                     await completeResurrection(entry.card_instance_id);
                                   } catch (error) {
                                     console.error('🏥 Error completing resurrection:', error);
                                   }
                                 }}
                                 size="sm"
                                 disabled={loading}
                                 className="bg-purple-600 hover:bg-purple-700"
                               >
                                 <Sparkles className="w-3 h-3 mr-1" />
                                 Забрать
                               </Button>
                             ) : (
                               <div className="flex items-center gap-1 text-sm text-purple-400">
                                 <Clock className="w-4 h-4" />
                                 {timeRemaining}
                               </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Статус:</span>
                            <Badge variant={isReady ? "default" : "secondary"} className="bg-purple-500/20 text-purple-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {timeRemaining}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Здоровье после:</span>
                            <span className="font-medium text-purple-400">
                              {targetHealth} / {entry.card_instances?.max_health || 0} (50%)
                            </span>
                          </div>
                          
                          {!isReady && <Progress value={progress} className="h-2 [&>div]:bg-purple-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Selection for Healing */}
      <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Отправить на лечение
            </CardTitle>
            {selectedCard && (
              <Button 
                onClick={handleStartHealing}
                disabled={loading || !canStartHealing}
                className="bg-red-600 hover:bg-red-700"
              >
                Начать лечение
              </Button>
            )}
          </div>
          <CardDescription>
            {canStartHealing 
              ? "Выберите раненую карту для лечения (мёртвые карты нельзя лечить)"
              : "Нет свободных слотов в медпункте"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {injuredCards.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет раненых карт для лечения</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {injuredCards.map((card) => {
                const cardData = card.card_data;
                const isSelected = selectedCard?.id === card.id;
                // Проверяем, находится ли карта в кузнице или медпункте
                const isInForgeBay = forgeBayEntries.some(entry => entry.card_instance_id === card.id);
                const isInMedicalBay = uniqueMedicalEntries.some(entry => entry.card_instance_id === card.id);
                const isBusy = isInForgeBay || isInMedicalBay;

                return (
                  <div 
                    key={card.id} 
                    className={`relative transition-all duration-200 ${
                      isBusy
                        ? 'opacity-60 cursor-not-allowed'
                        : isSelected 
                          ? 'ring-2 ring-red-500 scale-105 cursor-pointer' 
                          : canStartHealing 
                            ? 'hover:scale-105 cursor-pointer' 
                            : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBusy && canStartHealing && !loading) {
                        handleCardSelect(card);
                      }
                    }}
                  >
                    <div className="relative">
                      <CardDisplay 
                        card={{
                          ...cardData,
                          health: card.max_health,
                          currentHealth: card.current_health,
                          currentDefense: card.current_defense,
                          maxDefense: card.max_defense,
                          power: card.max_power,
                          defense: card.max_defense,
                          magic: card.max_magic
                        }}
                        showSellButton={false}
                        className="w-full"
                      />
                      
                      {/* Busy Indicator - показываем метку занятости */}
                      {isInMedicalBay && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            Лечится
                          </div>
                        </div>
                      )}
                      {isInForgeBay && !isInMedicalBay && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                            Ремонтируется
                          </div>
                        </div>
                      )}
                      
                      {!isBusy && isSelected && (
                        <div className="absolute top-2 left-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dead Cards Selection for Resurrection */}
      <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-purple-500" />
              Воскрешение мёртвых карт
            </CardTitle>
            {selectedDeadCard && (
              <Button 
                onClick={handleStartResurrection}
                disabled={loading || !canStartHealing || !canAffordResurrection}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Воскресить ({RESURRECTION_COST} ELL)
              </Button>
            )}
          </div>
          <CardDescription>
            {!canAffordResurrection 
              ? `Недостаточно ELL (нужно ${RESURRECTION_COST}, у вас ${playerBalance})`
              : canStartHealing 
                ? "Выберите мёртвую карту для воскрешения (50% здоровья, 1 час)"
                : "Нет свободных слотов в медпункте"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deadCards.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50 text-purple-400" />
              <p>Нет мёртвых карт</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {deadCards.map((card) => {
                const cardData = card.card_data;
                const isSelected = selectedDeadCard?.id === card.id;
                // Проверяем, находится ли карта в кузнице
                const isInForgeBay = forgeBayEntries.some(entry => entry.card_instance_id === card.id);
                const isBusy = isInForgeBay;
                const canSelect = !isBusy && canStartHealing && canAffordResurrection && !loading;

                return (
                  <div 
                    key={card.id} 
                    className={`relative transition-all duration-200 ${
                      isBusy
                        ? 'opacity-60 cursor-not-allowed'
                        : isSelected 
                          ? 'ring-2 ring-purple-500 scale-105 cursor-pointer' 
                          : canSelect 
                            ? 'hover:scale-105 cursor-pointer' 
                            : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canSelect) {
                        handleDeadCardSelect(card);
                      }
                    }}
                  >
                    <div className="relative">
                      <CardDisplay 
                        card={{
                          ...cardData,
                          health: card.max_health,
                          currentHealth: 0,
                          currentDefense: card.current_defense,
                          maxDefense: card.max_defense,
                          power: card.max_power,
                          defense: card.max_defense,
                          magic: card.max_magic
                        }}
                        showSellButton={false}
                        className="w-full opacity-60"
                      />
                      
                      {/* Busy Indicator - показываем метку занятости */}
                      {isBusy ? (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                            Ремонтируется
                          </div>
                        </div>
                      ) : (
                        /* Dead overlay */
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                          <span className="text-purple-400 font-bold text-sm">Мёртв</span>
                        </div>
                      )}
                      
                      {!isBusy && isSelected && (
                        <div className="absolute top-2 left-2">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Card Preview - Healing */}
      {selectedCard && (
        <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-red-500" />
              Предпросмотр лечения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="text-xs text-muted-foreground mb-2">Текущее состояние:</div>
                <CardDisplay 
                  card={selectedCard.card_data}
                  showSellButton={false}
                  className="w-24 h-32 text-xs"
                />
                <div className="mt-2 text-xs text-center">
                  <div className="bg-red-500/20 rounded px-2 py-1">
                    HP: {selectedCard.current_health}/{selectedCard.max_health}
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 flex items-center mt-8">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="flex-shrink-0">
                <div className="text-xs text-muted-foreground mb-2">После лечения:</div>
                <CardDisplay 
                  card={selectedCard.card_data}
                  showSellButton={false}
                  className="w-24 h-32 text-xs"
                />
                <div className="mt-2 text-xs text-center">
                  <div className="bg-green-500/20 rounded px-2 py-1">
                    HP: {selectedCard.max_health}/{selectedCard.max_health}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 ml-4">
                <h4 className="font-medium mb-2">{selectedCard.card_data?.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Нужно восстановить:</span>
                    <span className="text-red-500">{selectedCard.max_health - selectedCard.current_health} HP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Время лечения:</span>
                    <span>{Math.ceil((selectedCard.max_health - selectedCard.current_health) / HEAL_RATE)} мин</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Скорость:</span>
                    <span>{HEAL_RATE} HP/мин</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Dead Card Preview - Resurrection */}
      {selectedDeadCard && (
        <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Предпросмотр воскрешения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="text-xs text-purple-400 mb-2">Текущее состояние:</div>
                <div className="relative">
                  <CardDisplay 
                    card={selectedDeadCard.card_data}
                    showSellButton={false}
                    className="w-24 h-32 text-xs opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skull className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-center">
                  <div className="bg-purple-500/20 rounded px-2 py-1 text-purple-400">
                    HP: 0/{selectedDeadCard.max_health}
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 flex items-center mt-8">
                <ArrowRight className="w-5 h-5 text-purple-400" />
              </div>
              
              <div className="flex-shrink-0">
                <div className="text-xs text-purple-400 mb-2">После воскрешения:</div>
                <CardDisplay 
                  card={selectedDeadCard.card_data}
                  showSellButton={false}
                  className="w-24 h-32 text-xs"
                />
                <div className="mt-2 text-xs text-center">
                  <div className="bg-purple-500/20 rounded px-2 py-1 text-purple-400">
                    HP: {Math.floor(selectedDeadCard.max_health / 2)}/{selectedDeadCard.max_health} (50%)
                  </div>
                </div>
              </div>
              
              <div className="flex-1 ml-4">
                <h4 className="font-medium mb-2 text-purple-300">{selectedDeadCard.card_data?.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Здоровье после:</span>
                    <span className="text-purple-400">{Math.floor(selectedDeadCard.max_health / 2)} HP (50%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Время воскрешения:</span>
                    <span className="text-purple-400">1 час</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Стоимость:</span>
                    <span className="text-yellow-400">{RESURRECTION_COST} ELL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ваш баланс:</span>
                    <span className={canAffordResurrection ? "text-green-400" : "text-red-400"}>
                      {playerBalance} ELL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};