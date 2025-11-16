import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Search, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useBrightness } from "@/hooks/useBrightness";
import { useToast } from "@/hooks/use-toast";

interface TreasureHuntEvent {
  id: string;
  item_name: string;
  item_image_url: string | null;
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
  const navigate = useNavigate();
  const { accountId } = useWalletContext();
  const { brightness, backgroundBrightness } = useBrightness();
  const { toast } = useToast();
  
  const [activeEvent, setActiveEvent] = useState<TreasureHuntEvent | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveEvent();
  }, []);

  const loadActiveEvent = async () => {
    try {
      setLoading(true);
      
      const { data: event, error: eventError } = await supabase
        .from('treasure_hunt_events')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (eventError) throw eventError;

      if (event) {
        setActiveEvent(event);
        await loadFindings(event.id);
      }
    } catch (error) {
      console.error('Error loading active event:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить активное событие",
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
        .order('found_at', { ascending: true });

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
                <p className="text-xl text-white/70">Сейчас нет активных событий</p>
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
                        <h3 className="text-xl font-bold text-white mb-2">
                          Найти: {activeEvent.item_name}
                        </h3>
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
                            <span>Активно</span>
                          </div>
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
                      {findings.map((finding, index) => (
                        <Card key={finding.id} variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`text-2xl font-bold w-8 flex-shrink-0 ${
                                  index === 0 ? 'text-yellow-400' : 
                                  index === 1 ? 'text-gray-300' : 
                                  index === 2 ? 'text-amber-600' : 'text-white'
                                }`}>
                                  #{index + 1}
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
                      ))}
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
