import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Award, Clock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

export const ReferralLeaderboard = () => {
  const { toast } = useToast();
  
  const [allTimeStats, setAllTimeStats] = useState<ReferralStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<ReferralStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);

  useEffect(() => {
    loadReferralStats();
    
    const intervalId = setInterval(() => {
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
      
      const { data, error } = await supabase.rpc('get_referral_stats');

      if (error) {
        console.error('Error loading referral stats:', error);
        throw error;
      }

      if (!data) {
        console.warn('No data returned from get_referral_stats');
        return;
      }

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

      const allTimeStats: ReferralStats[] = statsData.all_time.map(item => ({
        wallet_address: item.wallet_address,
        total_referrals: item.total_referrals,
        wl_referrals: item.wl_referrals,
        no_wl_referrals: item.no_wl_referrals,
        weekly_referrals: 0,
        weekly_wl_referrals: 0,
        weekly_no_wl_referrals: 0,
      }));

      const weeklyStats: ReferralStats[] = statsData.weekly.map(item => ({
        wallet_address: item.wallet_address,
        total_referrals: 0,
        wl_referrals: 0,
        no_wl_referrals: 0,
        weekly_referrals: item.weekly_referrals,
        weekly_wl_referrals: item.weekly_wl_referrals,
        weekly_no_wl_referrals: item.weekly_no_wl_referrals,
      }));

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

  const loadReferralDetails = async (wallet: string, isWeekly: boolean = false) => {
    try {
      const { data, error } = await supabase.rpc('get_referral_details', {
        p_referrer_wallet: wallet,
        p_wl_only: null
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

      if (isWeekly) {
        const { monday, sunday } = getWeekBounds();
        details = details.filter(detail => {
          const createdAt = new Date(detail.created_at);
          return createdAt >= monday && createdAt <= sunday;
        });
      }

      setReferralDetails(details);
      setSelectedReferrer(wallet);
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
                      className="text-xs px-3 py-1 h-7 border-primary text-white hover:bg-primary/10 rounded-3xl bg-primary/5"
                      onClick={() => loadReferralDetails(stat.wallet_address, isWeekly)}
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Показать всех
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
    <div className="space-y-4">
      {/* Общая статистика */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-white/70">Всего игроков</div>
                  <div className="text-xl font-bold text-white">{overallStats.totalPlayers}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-white/70">Всего рефералов</div>
                  <div className="text-xl font-bold text-white">{overallStats.totalReferrals}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-xs text-white/70">Среднее на игрока</div>
                  <div className="text-xl font-bold text-white">{overallStats.avgReferralsPerPlayer}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="menu" className="md:col-span-2" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-white/70">За эту неделю</div>
                  <div className="text-lg font-bold text-white">{overallStats.weeklyTotalReferrals} рефералов</div>
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

      {/* Рейтинг рефералов */}
      <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Рейтинг рефералов
          </h3>
          
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
        </CardContent>
      </Card>

      {/* Dialog для просмотра рефералов */}
      <Dialog open={selectedReferrer !== null} onOpenChange={() => setSelectedReferrer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-black/90 border-2 border-white backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-primary" />
              Рефералы игрока {selectedReferrer}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            {referralDetails.length === 0 ? (
              <div className="text-center py-4 text-white/70">
                Нет рефералов
              </div>
            ) : (
              referralDetails.map((detail) => (
                <div 
                  key={detail.wallet_address}
                  className="flex items-center justify-between p-3 bg-white/10 border border-white/20 rounded-xl"
                >
                  <div>
                    <div className="text-sm text-white font-mono truncate">
                      {detail.wallet_address}
                    </div>
                    <div className="text-xs text-white/60">
                      {new Date(detail.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  {detail.has_wl && (
                    <div className="flex items-center gap-1 text-green-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs">WL</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
