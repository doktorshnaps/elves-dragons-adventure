import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Users, UserCheck, UserX, TrendingUp, Award, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useBrightness } from "@/hooks/useBrightness";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  wallet_address: string;
  total_referrals: number;
  wl_referrals: number;
  no_wl_referrals: number;
  weekly_referrals: number;
  weekly_wl_referrals: number;
  weekly_no_wl_referrals: number;
}

interface ReferralDetail {
  wallet_address: string;
  created_at: string;
  has_wl: boolean;
}

interface OverallStats {
  totalPlayers: number;
  totalReferrals: number;
  totalWLReferrals: number;
  totalNoWLReferrals: number;
  avgReferralsPerPlayer: number;
  weeklyTotalReferrals: number;
  weeklyWLReferrals: number;
  weeklyNoWLReferrals: number;
  topReferrer: string;
  topReferrerCount: number;
  lastUpdated: Date;
}

export const SoulArchive = () => {
  const navigate = useNavigate();
  const { accountId } = useWalletContext();
  const { brightness, backgroundBrightness } = useBrightness();
  const { toast } = useToast();
  
  const [allTimeStats, setAllTimeStats] = useState<ReferralStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<ReferralStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);
  const [showWL, setShowWL] = useState<boolean | null>(null);

  // Загрузка статистики при монтировании и каждый час
  useEffect(() => {
    loadReferralStats();
    
    // Автообновление каждый час (3600000 мс)
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing Soul Archive stats...');
      loadReferralStats();
    }, 3600000);

    return () => clearInterval(intervalId);
  }, []);

  const getWeekBounds = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
  };

  const loadReferralStats = async () => {
    try {
      setLoading(true);
      
      // Получаем всех игроков
      const { data: players, error: playersError } = await supabase
        .from('game_data')
        .select('wallet_address')
        .eq('initialized', true);

      if (playersError) throw playersError;

      // Получаем все активные рефералы
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('referrer_wallet_address, referred_wallet_address, created_at, is_active')
        .eq('is_active', true);

      if (refError) {
        console.error('Referrals query error:', refError);
        // Если не можем получить данные напрямую, используем RPC функцию
        toast({
          title: "Информация",
          description: "Данные о рефералах загружаются...",
        });
        setLoading(false);
        return;
      }

      // Получаем все WL адреса
      const { data: whitelisted, error: wlError } = await supabase
        .from('whitelist')
        .select('wallet_address')
        .eq('is_active', true);

      if (wlError) throw wlError;

      const wlAddresses = new Set(whitelisted?.map(w => w.wallet_address) || []);
      
      // Границы текущей недели
      const { monday, sunday } = getWeekBounds();

      // Группируем рефералы по реферерам
      const statsMap = new Map<string, ReferralStats>();

      referrals?.forEach(ref => {
        const referrer = ref.referrer_wallet_address;
        const hasWL = wlAddresses.has(ref.referred_wallet_address);
        const createdAt = new Date(ref.created_at);
        const isThisWeek = createdAt >= monday && createdAt <= sunday;

        if (!statsMap.has(referrer)) {
          statsMap.set(referrer, {
            wallet_address: referrer,
            total_referrals: 0,
            wl_referrals: 0,
            no_wl_referrals: 0,
            weekly_referrals: 0,
            weekly_wl_referrals: 0,
            weekly_no_wl_referrals: 0,
          });
        }

        const stats = statsMap.get(referrer)!;
        stats.total_referrals++;
        
        if (hasWL) {
          stats.wl_referrals++;
        } else {
          stats.no_wl_referrals++;
        }

        if (isThisWeek) {
          stats.weekly_referrals++;
          if (hasWL) {
            stats.weekly_wl_referrals++;
          } else {
            stats.weekly_no_wl_referrals++;
          }
        }
      });

      const allStats = Array.from(statsMap.values());
      
      // Сортируем для all-time рейтинга
      const sortedAllTime = [...allStats].sort((a, b) => b.total_referrals - a.total_referrals);
      
      // Сортируем для weekly рейтинга
      const sortedWeekly = [...allStats].sort((a, b) => b.weekly_referrals - a.weekly_referrals);

      // Вычисляем общую статистику
      const totalPlayersCount = players?.length || 0;
      const totalReferralsCount = referrals?.length || 0;
      const totalWLCount = referrals?.filter(r => wlAddresses.has(r.referred_wallet_address)).length || 0;
      const weeklyReferrals = referrals?.filter(r => {
        const createdAt = new Date(r.created_at);
        return createdAt >= monday && createdAt <= sunday;
      }) || [];
      const weeklyWLCount = weeklyReferrals.filter(r => wlAddresses.has(r.referred_wallet_address)).length;

      const overall: OverallStats = {
        totalPlayers: totalPlayersCount,
        totalReferrals: totalReferralsCount,
        totalWLReferrals: totalWLCount,
        totalNoWLReferrals: totalReferralsCount - totalWLCount,
        avgReferralsPerPlayer: allStats.length > 0 ? Math.round((totalReferralsCount / allStats.length) * 10) / 10 : 0,
        weeklyTotalReferrals: weeklyReferrals.length,
        weeklyWLReferrals: weeklyWLCount,
        weeklyNoWLReferrals: weeklyReferrals.length - weeklyWLCount,
        topReferrer: sortedAllTime[0]?.wallet_address || '-',
        topReferrerCount: sortedAllTime[0]?.total_referrals || 0,
        lastUpdated: new Date(),
      };

      console.log('📊 Soul Archive stats loaded:', {
        totalPlayers: totalPlayersCount,
        totalReferrals: totalReferralsCount,
        referrersCount: allStats.length,
      });

      setAllTimeStats(sortedAllTime);
      setWeeklyStats(sortedWeekly);
      setOverallStats(overall);
    } catch (error) {
      console.error('Error loading referral stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику рефералов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReferralDetails = async (wallet: string, wlFilter: boolean | null) => {
    try {
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('referred_wallet_address, created_at')
        .eq('referrer_wallet_address', wallet)
        .eq('is_active', true);

      if (refError) throw refError;

      const { data: whitelisted, error: wlError } = await supabase
        .from('whitelist')
        .select('wallet_address')
        .eq('is_active', true);

      if (wlError) throw wlError;

      const wlAddresses = new Set(whitelisted?.map(w => w.wallet_address) || []);

      let details = referrals?.map(ref => ({
        wallet_address: ref.referred_wallet_address,
        created_at: ref.created_at,
        has_wl: wlAddresses.has(ref.referred_wallet_address),
      })) || [];

      // Фильтруем по WL если нужно
      if (wlFilter !== null) {
        details = details.filter(d => d.has_wl === wlFilter);
      }

      setReferralDetails(details);
      setSelectedReferrer(wallet);
      setShowWL(wlFilter);
    } catch (error) {
      console.error('Error loading referral details:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список рефералов",
        variant: "destructive",
      });
    }
  };

  const renderLeaderboard = (stats: ReferralStats[], isWeekly: boolean) => {
    if (stats.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Нет данных о рефералах
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {stats.map((stat, index) => {
          const referrals = isWeekly ? stat.weekly_referrals : stat.total_referrals;
          const wlCount = isWeekly ? stat.weekly_wl_referrals : stat.wl_referrals;
          const noWlCount = isWeekly ? stat.weekly_no_wl_referrals : stat.no_wl_referrals;

          return (
            <Card key={stat.wallet_address} className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl font-bold text-primary w-8 flex-shrink-0">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {stat.wallet_address}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{referrals} рефералов</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-3 py-1 h-7 border-green-500 text-green-500 hover:bg-green-500/10"
                      onClick={() => loadReferralDetails(stat.wallet_address, true)}
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      WL: {wlCount}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-3 py-1 h-7 border-orange-500 text-orange-500 hover:bg-orange-500/10"
                      onClick={() => loadReferralDetails(stat.wallet_address, false)}
                    >
                      <UserX className="w-3 h-3 mr-1" />
                      noWL: {noWlCount}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 relative" style={{ filter: `brightness(${brightness}%)` }}>
      <div 
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/menu-background.jpg")',
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
          className="mb-4 border-2 border-white text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад в меню
        </Button>

        {/* Общая статистика */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="bg-black/50 border-2 border-white backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Всего игроков</div>
                    <div className="text-2xl font-bold text-white">{overallStats.totalPlayers}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-2 border-white backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Всего рефералов</div>
                    <div className="text-2xl font-bold text-white">{overallStats.totalReferrals}</div>
                    <div className="text-xs text-white/60">
                      WL: {overallStats.totalWLReferrals} | noWL: {overallStats.totalNoWLReferrals}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-2 border-white backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Award className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Среднее на игрока</div>
                    <div className="text-2xl font-bold text-white">{overallStats.avgReferralsPerPlayer}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-2 border-white backdrop-blur-sm md:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-white/70">За эту неделю</div>
                    <div className="text-xl font-bold text-white">{overallStats.weeklyTotalReferrals} рефералов</div>
                    <div className="text-xs text-white/60">
                      WL: {overallStats.weeklyWLReferrals} | noWL: {overallStats.weeklyNoWLReferrals}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-2 border-white backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-xs text-white/70 mb-1">Последнее обновление</div>
                <div className="text-sm font-medium text-white">
                  {overallStats.lastUpdated.toLocaleTimeString('ru-RU')}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Авто-обновление каждый час
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-black/50 border-2 border-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <img src="/src/assets/soul-archive-icon.png" alt="Soul Archive" className="w-8 h-8" />
              Рейтинг рефералов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-white">Загрузка...</div>
            ) : (
              <Tabs defaultValue="all-time" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="all-time">За все время</TabsTrigger>
                  <TabsTrigger value="weekly">Недельный</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all-time">
                  {renderLeaderboard(allTimeStats, false)}
                </TabsContent>
                
                <TabsContent value="weekly">
                  {renderLeaderboard(weeklyStats, true)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedReferrer !== null} onOpenChange={() => setSelectedReferrer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showWL ? (
                <>
                  <UserCheck className="w-5 h-5 text-green-500" />
                  Рефералы с WL
                </>
              ) : (
                <>
                  <UserX className="w-5 h-5 text-orange-500" />
                  Рефералы без WL
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            {referralDetails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет рефералов
              </div>
            ) : (
              referralDetails.map((detail, index) => (
                <Card key={index} className="bg-card/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {detail.wallet_address}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(detail.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      {detail.has_wl ? (
                        <UserCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <UserX className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
