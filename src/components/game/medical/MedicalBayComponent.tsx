import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Heart, Plus } from 'lucide-react';
import { useMedicalBay } from '@/hooks/useMedicalBay';
import { useCardInstances } from '@/hooks/useCardInstances';

export const MedicalBayComponent = () => {
  const {
    medicalBayEntries,
    loading,
    loadMedicalBayEntries,
    placeCardInMedicalBay,
    removeCardFromMedicalBay,
    processMedicalBayHealing
  } = useMedicalBay();

  const { cardInstances, loadCardInstances } = useCardInstances();

  useEffect(() => {
    loadMedicalBayEntries();
    loadCardInstances();
  }, [loadMedicalBayEntries, loadCardInstances]);

  // Автоматическая обработка лечения каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      processMedicalBayHealing();
    }, 60000); // каждую минуту

    return () => clearInterval(interval);
  }, [processMedicalBayHealing]);

  const getInjuredCards = () => {
    // Получаем ID карт, которые сейчас в медпункте
    const cardsInMedicalBay = medicalBayEntries.map(entry => entry.card_instance_id);
    
    return cardInstances.filter(card => 
      card.current_health < card.max_health && 
      !cardsInMedicalBay.includes(card.id)
    );
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Медпункт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Активные лечения */}
            {medicalBayEntries.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Карты на лечении:</h3>
                <div className="space-y-3">
                  {medicalBayEntries.map((entry) => {
                    const cardData = entry.card_instances?.card_data;
                    const progress = getHealingProgress(entry.placed_at, entry.estimated_completion);
                    const timeRemaining = getEstimatedTimeRemaining(entry.estimated_completion);
                    const isReady = timeRemaining === "Готово";

                    return (
                      <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{cardData?.name || 'Неизвестная карта'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {cardData?.type === 'pet' ? 'Дракон' : 'Герой'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4" />
                              {timeRemaining}
                            </div>
                            {isReady && (
                              <Button
                                size="sm"
                                onClick={() => removeCardFromMedicalBay(entry.card_instance_id)}
                                disabled={loading}
                                className="mt-2"
                              >
                                Забрать
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Прогресс лечения:</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Скорость лечения: {entry.heal_rate} HP/мин
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Раненые карты */}
            {injuredCards.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Раненые карты:</h3>
                <div className="grid gap-3">
                  {injuredCards.map((card) => {
                    const healthPercentage = (card.current_health / card.max_health) * 100;
                    const cardData = card.card_data;

                    return (
                      <div key={card.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{cardData?.name || 'Неизвестная карта'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {cardData?.type === 'pet' ? 'Дракон' : 'Герой'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => placeCardInMedicalBay(card.id)}
                            disabled={loading}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            В медпункт
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Здоровье:</span>
                            <span>{card.current_health}/{card.max_health}</span>
                          </div>
                          <Progress value={healthPercentage} />
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-2">
                          Естественное восстановление: 1 HP/мин
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {injuredCards.length === 0 && medicalBayEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Все карты здоровы!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};