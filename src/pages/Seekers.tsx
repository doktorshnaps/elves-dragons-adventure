import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Search, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useBrightness } from "@/hooks/useBrightness";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/utils/timeUtils";
import { usePageTitle } from "@/hooks/usePageTitle";

interface TreasureHuntEvent {
  id: string;
  item_name: string;
  item_image_url: string | null;
  item_template_id: number | null;
  monster_id: string | null;
  drop_chance: number;
  dungeon_number: number | null;
  total_quantity: number;
  found_quantity: number;
  max_winners: number;
  reward_amount: number;
  is_active: boolean;
  started_at: string | null;
  ended_at: string | null;
}

interface Finding {
  id: string;
  wallet_address: string;
  found_quantity: number;
  reward_claimed: boolean;
  found_at: string;
}

export const Seekers = () => {
  usePageTitle('Искатели - События и награды');
  const navigate = useNavigate();
  const { accountId } = useWalletContext();
  const { brightness, backgroundBrightness } = useBrightness();
  const { toast } = useToast();
  
  const [activeEvent, setActiveEvent] = useState<TreasureHuntEvent | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    loadActiveEvent();
  }, []);

  const endEvent = useCallback(async () => {
    if (!activeEvent) return;

    try {
      const { error } = await supabase
        .from('treasure_hunt_events')
        .update({ 
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', activeEvent.id);

      if (error) throw error;

      toast({
        title: "Событие завершено",
        description: "Победители зафиксированы в таблице лидеров",
      });

      // Обновляем локальное состояние события, не очищаем его
      setActiveEvent(prev => prev ? { ...prev, is_active: false } : null);
    } catch (error) {
      console.error('Error ending event:', error);
    }
  }, [activeEvent, toast]);

  useEffect(() => {
    if (!activeEvent?.ended_at) return;

    const calculateTimeRemaining = () => {
      const endTime = new Date(activeEvent.ended_at!).getTime();
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
        endEvent();
        return;
      }

      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [activeEvent?.ended_at, endEvent]);

  const loadActiveEvent = async () => {
    try {
      setLoading(true);
      
      // Загружаем последнее событие (активное или недавно завершенное)
      const { data: event, error: eventError } = await supabase
        .from('treasure_hunt_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (eventError) throw eventError;

      if (event) {
        setActiveEvent(event);
        await loadFindings(event.id);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить событие",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFindings = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('treasure_hunt_findings')
        .select('*')
        .eq('event_id', eventId)
        .order('found_quantity', { ascending: false });

      if (error) throw error;
      setFindings(data || []);
    } catch (error) {
      console.error('Error loading findings:', error);
    }
  };

  const remainingItems = activeEvent 
    ? activeEvent.total_quantity - activeEvent.found_quantity 
    : 0;

  const remainingWinners = activeEvent 
    ? activeEvent.max_winners - findings.filter(f => f.reward_claimed).length 
    : 0;

  return (
    <div className="min-h-screen p-4 relative" style={{ filter: `brightness(${brightness}%)` }}>
      <div 
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/menu-background.webp")',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: `brightness(${backgroundBrightness}%)`
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate('/menu')}
          className="mb-4 bg-black/50 border-2 border-white rounded-3xl text-white hover:bg-black/70 hover:text-white backdrop-blur-sm"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад в меню
        </Button>

        <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Search className="w-8 h-8" />
              Искатели
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-white">Загрузка...</div>
            ) : !activeEvent ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-white/50" />
                <p className="text-xl text-white/70">Сейчас нет событий</p>
                <p className="text-sm text-white/50 mt-2">
                  Следите за обновлениями, новые события скоро появятся!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Event Info */}
                <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {activeEvent.item_image_url && (
                        <img 
                          src={activeEvent.item_image_url} 
                          alt={activeEvent.item_name}
                          className="w-24 h-24 object-contain rounded-lg border-2 border-white/20"
                        />
                      )}
                      <div className="flex-1">
                        {!activeEvent.is_active && (
                          <div className="mb-3 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                            <div className="flex items-center gap-2 text-lg font-bold text-white">
                              <Trophy className="w-5 h-5" />
                              <span>Событие завершено - победители зафиксированы</span>
                            </div>
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-white mb-2">
                          Найти: {activeEvent.item_name}
                        </h3>
                        {activeEvent.ended_at && activeEvent.is_active && (
                          <div className="mb-4 p-3 bg-primary/20 rounded-lg border border-primary/30">
                            <div className="flex items-center gap-2 text-lg font-bold text-white">
                              <Clock className="w-5 h-5" />
                              <span>Осталось времени: {timeRemaining !== null ? formatTime(timeRemaining) : '--:--:--'}</span>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-white/80">
                            <Search className="w-4 h-4" />
                            <span>Осталось найти: <strong className="text-white">{remainingItems}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-white/80">
                            <Trophy className="w-4 h-4" />
                            <span>Мест с наградой: <strong className="text-white">{remainingWinners}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-white/80">
                            <Award className="w-4 h-4" />
                            <span>Награда: <strong className="text-white">{activeEvent.reward_amount} ELL</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-white/80">
                            <Clock className="w-4 h-4" />
                            <span>Шанс дропа: <strong className="text-white">{activeEvent.drop_chance}%</strong></span>
                          </div>
                          {activeEvent.monster_id && (
                            <div className="col-span-2 flex items-center gap-2 text-white/80">
                              <Trophy className="w-4 h-4" />
                              <span>Монстр: <strong className="text-white">{activeEvent.monster_id}</strong></span>
                            </div>
                          )}
                          {activeEvent.dungeon_number && (
                            <div className="col-span-2 flex items-center gap-2 text-white/80">
                              <Search className="w-4 h-4" />
                              <span>Подземелье: <strong className="text-white">#{activeEvent.dungeon_number}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Leaderboard */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Таблица лидеров
                  </h3>
                  {findings.length === 0 ? (
                    <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                      <CardContent className="p-6 text-center text-white/70">
                        Пока никто не нашел предметы. Будьте первым!
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {findings.map((finding, index) => {
                        const isWinnerPlace = index < (activeEvent?.max_winners || 0);
                        
                        return (
                          <Card 
                            key={finding.id} 
                            variant="menu" 
                            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                            className={isWinnerPlace ? 'border-2 border-yellow-500/50 bg-yellow-500/10' : ''}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`text-2xl font-bold w-8 flex-shrink-0 ${
                                    index === 0 ? 'text-yellow-400' : 
                                    index === 1 ? 'text-gray-300' : 
                                    index === 2 ? 'text-amber-600' : 
                                    isWinnerPlace ? 'text-yellow-500' : 'text-white'
                                  }`}>
                                    #{index + 1}
                                    {isWinnerPlace && <Trophy className="w-4 h-4 inline ml-1" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate text-white">
                                      {finding.wallet_address}
                                    </div>
                                    <div className="text-xs text-white/60">
                                      {new Date(finding.found_at).toLocaleString('ru-RU')}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <div className="text-right">
                                    <div className="text-sm font-bold text-white">
                                      {finding.found_quantity} шт.
                                    </div>
                                    {finding.reward_claimed && (
                                      <div className="text-xs text-green-400">
                                        ✓ Награда получена
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
