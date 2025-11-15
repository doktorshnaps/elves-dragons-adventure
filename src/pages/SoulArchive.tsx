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
import { SoulAltarTab } from "@/components/soul-altar/SoulAltarTab";

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
      
      // Используем новую RPC функцию для получения всей статистики
      const { data, error } = await supabase.rpc('get_referral_stats');

      if (error) {
        console.error('Error loading referral stats:', error);
        throw error;
      }

      if (!data) {
        console.warn('No data returned from get_referral_stats');
        return;
      }

      console.log('📊 Soul Archive stats loaded:', data);

      const statsData = data as {
        all_time: Array<{
          wallet_address: string;
          total_referrals: number;
          wl_referrals: number;
          no_wl_referrals: number;
        }>;
        weekly: Array<{
          wallet_address: string;
          weekly_referrals: number;
          weekly_wl_referrals: number;
          weekly_no_wl_referrals: number;
        }>;
        totals: {
          totalPlayers: number;
          totalReferrals: number;
          weeklyTotalReferrals: number;
        };
        lastUpdated: string;
      };

      // Преобразуем данные all_time в нужный формат
      const allTimeStats: ReferralStats[] = statsData.all_time.map(item => ({
        wallet_address: item.wallet_address,
        total_referrals: item.total_referrals,
        wl_referrals: item.wl_referrals,
        no_wl_referrals: item.no_wl_referrals,
        weekly_referrals: 0,
        weekly_wl_referrals: 0,
        weekly_no_wl_referrals: 0,
      }));

      // Преобразуем данные weekly в нужный формат
      const weeklyStats: ReferralStats[] = statsData.weekly.map(item => ({
        wallet_address: item.wallet_address,
        total_referrals: 0,
        wl_referrals: 0,
        no_wl_referrals: 0,
        weekly_referrals: item.weekly_referrals,
        weekly_wl_referrals: item.weekly_wl_referrals,
        weekly_no_wl_referrals: item.weekly_no_wl_referrals,
      }));

      // Подсчитываем WL/noWL для общей статистики
      const totalWLReferrals = allTimeStats.reduce((sum, stat) => sum + stat.wl_referrals, 0);
      const totalNoWLReferrals = allTimeStats.reduce((sum, stat) => sum + stat.no_wl_referrals, 0);
      const weeklyWLReferrals = weeklyStats.reduce((sum, stat) => sum + stat.weekly_wl_referrals, 0);
      const weeklyNoWLReferrals = weeklyStats.reduce((sum, stat) => sum + stat.weekly_no_wl_referrals, 0);

      const overall: OverallStats = {
        totalPlayers: statsData.totals.totalPlayers,
        totalReferrals: statsData.totals.totalReferrals,
        totalWLReferrals: totalWLReferrals,
        totalNoWLReferrals: totalNoWLReferrals,
        avgReferralsPerPlayer: allTimeStats.length > 0 
          ? Math.round((statsData.totals.totalReferrals / allTimeStats.length) * 10) / 10 
          : 0,
        weeklyTotalReferrals: statsData.totals.weeklyTotalReferrals,
        weeklyWLReferrals: weeklyWLReferrals,
        weeklyNoWLReferrals: weeklyNoWLReferrals,
        topReferrer: allTimeStats[0]?.wallet_address || '-',
        topReferrerCount: allTimeStats[0]?.total_referrals || 0,
        lastUpdated: new Date(statsData.lastUpdated),
      };

      setAllTimeStats(allTimeStats);
      setWeeklyStats(weeklyStats);
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

  const loadReferralDetails = async (wallet: string, wlFilter: boolean | null, isWeekly: boolean = false) => {
    try {
      // Используем новую RPC функцию для получения деталей
      const { data, error } = await supabase.rpc('get_referral_details', {
        p_referrer_wallet: wallet,
        p_wl_only: wlFilter
      });

      if (error) {
        console.error('Error loading referral details:', error);
        throw error;
      }

      let details: ReferralDetail[] = (data || []).map((item: any) => ({
        wallet_address: item.wallet_address,
        created_at: item.created_at,
        has_wl: item.has_wl,
      }));

      // Фильтруем по текущей неделе если isWeekly === true
      if (isWeekly) {
        const { monday, sunday } = getWeekBounds();
        details = details.filter(detail => {
          const createdAt = new Date(detail.created_at);
          return createdAt >= monday && createdAt <= sunday;
        });
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
        <div className="text-center py-8 text-white/70">
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
            <Card key={stat.wallet_address} variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl font-bold text-white w-8 flex-shrink-0">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-white">
                        {stat.wallet_address}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                        <Users className="w-3 h-3" />
                        <span>{referrals} рефералов</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-3 py-1 h-7 border-green-500 text-green-500 hover:bg-green-500/10 rounded-3xl bg-green-500/5"
                      onClick={() => loadReferralDetails(stat.wallet_address, true, isWeekly)}
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      WL: {wlCount}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-3 py-1 h-7 border-orange-500 text-orange-500 hover:bg-orange-500/10 rounded-3xl bg-orange-500/5"
                      onClick={() => loadReferralDetails(stat.wallet_address, false, isWeekly)}
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

        {/* Общая статистика */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
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

            <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
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

            <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
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

            <Card variant="menu" className="md:col-span-2" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
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

            <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
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

        <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <img src="/src/assets/soul-archive-icon.png" alt="Soul Archive" className="w-8 h-8" />
              Soul Archive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="referrals" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-black/40 border-2 border-white/50 backdrop-blur-sm rounded-3xl">
                <TabsTrigger value="referrals" className="text-white data-[state=active]:bg-white/20 rounded-3xl">
                  Рейтинг Рефералов
                </TabsTrigger>
                <TabsTrigger value="altar" className="text-white data-[state=active]:bg-white/20 rounded-3xl">
                  Алтарь Душ
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="referrals">
                {loading ? (
                  <div className="text-center py-8 text-white">Загрузка...</div>
                ) : (
                  <Tabs defaultValue="all-time" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-black/40 border-2 border-white/50 backdrop-blur-sm rounded-3xl">
                      <TabsTrigger value="all-time" className="text-white data-[state=active]:bg-white/20 rounded-3xl">За все время</TabsTrigger>
                      <TabsTrigger value="weekly" className="text-white data-[state=active]:bg-white/20 rounded-3xl">Недельный</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all-time">
                      {renderLeaderboard(allTimeStats, false)}
                    </TabsContent>
                    
                    <TabsContent value="weekly">
                      {renderLeaderboard(weeklyStats, true)}
                    </TabsContent>
                  </Tabs>
                )}
              </TabsContent>
              
              <TabsContent value="altar">
                <SoulAltarTab />
              </TabsContent>
            </Tabs>
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
