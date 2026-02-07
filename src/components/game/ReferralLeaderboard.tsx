import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Award, Clock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDisplayNames } from "@/hooks/useDisplayNames";
import { useAdmin } from "@/contexts/AdminContext";

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
  avgReferralsPerPlayer: number;
  weeklyTotalReferrals: number;
  lastUpdated: Date;
}

export const ReferralLeaderboard = () => {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  
  const [allTimeStats, setAllTimeStats] = useState<ReferralStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<ReferralStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);

  // Collect all wallet addresses for display name lookup
  const allWallets = useMemo(() => {
    const wallets = new Set<string>();
    allTimeStats.forEach(s => wallets.add(s.wallet_address));
    weeklyStats.forEach(s => wallets.add(s.wallet_address));
    referralDetails.forEach(d => wallets.add(d.wallet_address));
    return [...wallets];
  }, [allTimeStats, weeklyStats, referralDetails]);
  
  const { getDisplayName } = useDisplayNames(allWallets);
  
  const formatWallet = (wallet: string) => {
    if (isAdmin) return `${wallet.slice(0, 8)}...${wallet.slice(-4)}`;
    return getDisplayName(wallet);
  };

  useEffect(() => {
    loadReferralStats();
    const intervalId = setInterval(loadReferralStats, 3600000);
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

      if (error) throw error;
      if (!data) return;

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

      const overall: OverallStats = {
        totalPlayers: statsData.totals.totalPlayers,
        totalReferrals: statsData.totals.totalReferrals,
        avgReferralsPerPlayer: allTimeStats.length > 0 
          ? Math.round((statsData.totals.totalReferrals / allTimeStats.length) * 10) / 10 
          : 0,
        weeklyTotalReferrals: statsData.totals.weeklyTotalReferrals,
        lastUpdated: new Date(statsData.lastUpdated),
      };

      setAllTimeStats(allTimeStats);
      setWeeklyStats(weeklyStats);
      setOverallStats(overall);
    } catch (error) {
      console.error('Error loading referral stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику",
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

      if (error) throw error;

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
    }
  };

  const renderLeaderboard = (stats: ReferralStats[], isWeekly: boolean) => {
    if (stats.length === 0) {
      return (
        <div className="text-center py-6 text-white/50 text-sm">
          Нет данных
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {stats.slice(0, 15).map((stat, index) => {
          const referrals = isWeekly ? stat.weekly_referrals : stat.total_referrals;

          return (
            <div 
              key={stat.wallet_address} 
              className="flex items-center justify-between p-2 bg-white/10 rounded-xl hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`text-sm font-bold w-6 ${
                  index === 0 ? 'text-yellow-400' : 
                  index === 1 ? 'text-gray-300' : 
                  index === 2 ? 'text-orange-400' : 'text-white/70'
                }`}>
                  #{index + 1}
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-white truncate">
                      {formatWallet(stat.wallet_address)}
                  </div>
                  <div className="text-xs text-white/50">
                    {referrals} реф.
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 px-2 text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => loadReferralDetails(stat.wallet_address, isWeekly)}
              >
                <Users className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Компактная статистика */}
      {overallStats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <Users className="w-4 h-4 text-white/60 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{overallStats.totalPlayers}</div>
            <div className="text-xs text-white/50">игроков</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{overallStats.totalReferrals}</div>
            <div className="text-xs text-white/50">всего</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{overallStats.weeklyTotalReferrals}</div>
            <div className="text-xs text-white/50">за неделю</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <Award className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{overallStats.avgReferralsPerPlayer}</div>
            <div className="text-xs text-white/50">среднее</div>
          </div>
        </div>
      )}

      {/* Таблица рейтинга */}
      <div className="bg-black/50 border border-white/50 rounded-2xl p-4 backdrop-blur-sm">
        {loading ? (
          <div className="text-center py-6 text-white/60 text-sm">Загрузка...</div>
        ) : (
          <Tabs defaultValue="all-time" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 bg-black/40 border border-white/30 rounded-xl h-8">
              <TabsTrigger value="all-time" className="text-white text-xs data-[state=active]:bg-white/20 rounded-lg">
                Все время
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-white text-xs data-[state=active]:bg-white/20 rounded-lg">
                Неделя
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-time">
              {renderLeaderboard(allTimeStats, false)}
            </TabsContent>
            
            <TabsContent value="weekly">
              {renderLeaderboard(weeklyStats, true)}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialog для просмотра рефералов */}
      <Dialog open={selectedReferrer !== null} onOpenChange={() => setSelectedReferrer(null)}>
        <DialogContent className="max-w-sm max-h-[60vh] overflow-y-auto bg-black/95 border border-white/50 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Рефералы
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            {referralDetails.length === 0 ? (
              <div className="text-center py-4 text-white/50 text-sm">Нет рефералов</div>
            ) : (
              referralDetails.map((detail) => (
                <div 
                  key={detail.wallet_address}
                  className="flex items-center justify-between p-2 bg-white/10 rounded-xl"
                >
                  <div>
                    <div className="text-xs text-white font-mono">
                      {formatWallet(detail.wallet_address)}
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(detail.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  {detail.has_wl && (
                    <Shield className="w-4 h-4 text-green-400" />
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
